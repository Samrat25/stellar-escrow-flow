#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String, Vec};

#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
pub enum EscrowState {
    Created = 0,
    Funded = 1,
    Active = 2,
    Completed = 3,
    Cancelled = 4,
}

#[derive(Clone, Copy, PartialEq, Eq)]
#[contracttype]
pub enum MilestoneStatus {
    Pending = 0,
    Submitted = 1,
    Approved = 2,
    Rejected = 3,
}

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub amount: i128,
    pub status: MilestoneStatus,
    pub submitted_at: u64,
    pub approved_at: u64,
    pub deadline: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Escrow {
    pub escrow_id: String,
    pub client: Address,
    pub freelancer: Address,
    pub total_amount: i128,
    pub milestones: Vec<Milestone>,
    pub review_window: u64,
    pub state: EscrowState,
    pub created_at: u64,
    pub deadline: u64,
}

#[contracttype]
pub enum DataKey {
    Escrow,
    Token,
    ReleasedAmount,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn create_escrow(
        env: Env,
        escrow_id: String,
        client: Address,
        freelancer: Address,
        token: Address,
        milestone_amounts: Vec<i128>,
        review_window_days: u32,
        deadline_timestamp: u64,
    ) {
        client.require_auth();
        assert!(client != freelancer, "Client and freelancer must differ");
        assert!(!milestone_amounts.is_empty(), "Need at least one milestone");
        assert!(review_window_days > 0, "Review window must be positive");
        assert!(deadline_timestamp > env.ledger().timestamp(), "Deadline must be in future");

        let mut total_amount: i128 = 0;
        for i in 0..milestone_amounts.len() {
            let amount = milestone_amounts.get(i).unwrap();
            assert!(amount > 0, "Milestone amounts must be positive");
            total_amount += amount;
        }

        let review_window_secs = (review_window_days as u64) * 86400;
        let mut milestones = Vec::new(&env);
        for i in 0..milestone_amounts.len() {
            let amount = milestone_amounts.get(i).unwrap();
            milestones.push_back(Milestone {
                amount,
                status: MilestoneStatus::Pending,
                submitted_at: 0,
                approved_at: 0,
                deadline: deadline_timestamp,
            });
        }

        let escrow = Escrow {
            escrow_id: escrow_id.clone(),
            client: client.clone(),
            freelancer: freelancer.clone(),
            total_amount,
            milestones,
            review_window: review_window_secs,
            state: EscrowState::Created,
            created_at: env.ledger().timestamp(),
            deadline: deadline_timestamp,
        };

        env.storage().instance().set(&DataKey::Escrow, &escrow);
        env.storage().instance().set(&DataKey::Token, &token);
        env.events().publish(
            (String::from_str(&env, "EscrowCreated"),),
            (escrow_id, client, freelancer, total_amount, deadline_timestamp),
        );
    }

    pub fn deposit_funds(env: Env, client: Address) {
        client.require_auth();
        let mut escrow: Escrow = env.storage().instance().get(&DataKey::Escrow).expect("Escrow not found");
        assert!(escrow.client == client, "Only client can deposit");
        assert!(escrow.state == EscrowState::Created, "Already funded");

        let token_address: Address = env.storage().instance().get(&DataKey::Token).expect("Token not found");
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&client, &env.current_contract_address(), &escrow.total_amount);

        escrow.state = EscrowState::Funded;
        env.storage().instance().set(&DataKey::Escrow, &escrow);
        env.events().publish((String::from_str(&env, "FundsDeposited"),), (client, escrow.total_amount));
    }

    pub fn submit_milestone(env: Env, freelancer: Address, milestone_index: u32) {
        freelancer.require_auth();
        let mut escrow: Escrow = env.storage().instance().get(&DataKey::Escrow).expect("Escrow not found");
        assert!(escrow.freelancer == freelancer, "Only freelancer can submit");
        assert!(escrow.state == EscrowState::Funded || escrow.state == EscrowState::Active, "Escrow not active");

        let milestone = escrow.milestones.get(milestone_index).expect("Invalid milestone index");
        assert!(milestone.status == MilestoneStatus::Pending || milestone.status == MilestoneStatus::Rejected, "Milestone already submitted or approved");

        if milestone_index > 0 {
            let prev_milestone = escrow.milestones.get(milestone_index - 1).unwrap();
            assert!(prev_milestone.status == MilestoneStatus::Approved, "Previous milestone must be approved first");
        }

        let mut updated_milestone = milestone;
        updated_milestone.status = MilestoneStatus::Submitted;
        updated_milestone.submitted_at = env.ledger().timestamp();
        escrow.milestones.set(milestone_index, updated_milestone);

        if escrow.state == EscrowState::Funded {
            escrow.state = EscrowState::Active;
        }

        env.storage().instance().set(&DataKey::Escrow, &escrow);
        env.events().publish((String::from_str(&env, "MilestoneSubmitted"),), (freelancer, milestone_index));
    }

    pub fn approve_milestone(env: Env, client: Address, milestone_index: u32) {
        client.require_auth();
        let mut escrow: Escrow = env.storage().instance().get(&DataKey::Escrow).expect("Escrow not found");
        assert!(escrow.client == client, "Only client can approve");

        let milestone = escrow.milestones.get(milestone_index).expect("Invalid milestone index");
        assert!(milestone.status == MilestoneStatus::Submitted, "Milestone not submitted");

        let milestone_amount = milestone.amount;
        let current_time = env.ledger().timestamp();

        let token_address: Address = env.storage().instance().get(&DataKey::Token).expect("Token not found");
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &escrow.freelancer, &milestone_amount);

        let mut updated_milestone = milestone;
        updated_milestone.status = MilestoneStatus::Approved;
        updated_milestone.approved_at = current_time;
        escrow.milestones.set(milestone_index, updated_milestone);

        let mut all_approved = true;
        for i in 0..escrow.milestones.len() {
            let m = escrow.milestones.get(i).unwrap();
            if m.status != MilestoneStatus::Approved {
                all_approved = false;
                break;
            }
        }

        if all_approved {
            escrow.state = EscrowState::Completed;
        }

        env.storage().instance().set(&DataKey::Escrow, &escrow);
        env.events().publish(
            (String::from_str(&env, "MilestoneApproved"),),
            (client, milestone_index, milestone_amount, current_time),
        );
    }

    pub fn reject_milestone(env: Env, client: Address, milestone_index: u32) {
        client.require_auth();
        let mut escrow: Escrow = env.storage().instance().get(&DataKey::Escrow).expect("Escrow not found");
        assert!(escrow.client == client, "Only client can reject");

        let milestone = escrow.milestones.get(milestone_index).expect("Invalid milestone index");
        assert!(milestone.status == MilestoneStatus::Submitted, "Milestone not submitted");

        let mut updated_milestone = milestone;
        updated_milestone.status = MilestoneStatus::Rejected;
        escrow.milestones.set(milestone_index, updated_milestone);

        env.storage().instance().set(&DataKey::Escrow, &escrow);
        env.events().publish((String::from_str(&env, "MilestoneRejected"),), (client, milestone_index));
    }

    pub fn auto_approve(env: Env, milestone_index: u32) {
        let mut escrow: Escrow = env.storage().instance().get(&DataKey::Escrow).expect("Escrow not found");
        let milestone = escrow.milestones.get(milestone_index).expect("Invalid milestone index");
        assert!(milestone.status == MilestoneStatus::Submitted, "Milestone not submitted");

        let current_time = env.ledger().timestamp();
        let deadline = milestone.submitted_at + escrow.review_window;
        assert!(current_time >= deadline, "Review window not expired");

        let milestone_amount = milestone.amount;
        
        let token_address: Address = env.storage().instance().get(&DataKey::Token).expect("Token not found");
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &escrow.freelancer, &milestone_amount);

        let mut updated_milestone = milestone;
        updated_milestone.status = MilestoneStatus::Approved;
        updated_milestone.approved_at = current_time;
        escrow.milestones.set(milestone_index, updated_milestone);

        let mut all_approved = true;
        for i in 0..escrow.milestones.len() {
            let m = escrow.milestones.get(i).unwrap();
            if m.status != MilestoneStatus::Approved {
                all_approved = false;
                break;
            }
        }

        if all_approved {
            escrow.state = EscrowState::Completed;
        }

        env.storage().instance().set(&DataKey::Escrow, &escrow);
        env.events().publish(
            (String::from_str(&env, "MilestoneAutoApproved"),),
            (milestone_index, milestone_amount, current_time),
        );
    }

    pub fn auto_release(env: Env, escrow_id: String) {
        let mut escrow: Escrow = env.storage().instance().get(&DataKey::Escrow).expect("Escrow not found");
        assert!(escrow.escrow_id == escrow_id, "Escrow ID mismatch");

        let current_time = env.ledger().timestamp();
        assert!(current_time >= escrow.deadline, "Deadline not passed");
        assert!(escrow.state != EscrowState::Cancelled, "Cancellation not allowed");

        // Auto-approve any submitted but unapproved milestones
        for i in 0..escrow.milestones.len() {
            let milestone = escrow.milestones.get(i).unwrap();
            
            if milestone.status == MilestoneStatus::Submitted {
                let token_address: Address = env.storage().instance().get(&DataKey::Token).expect("Token not found");
                let token_client = token::Client::new(&env, &token_address);
                token_client.transfer(&env.current_contract_address(), &escrow.freelancer, &milestone.amount);

                let mut updated_milestone = milestone;
                updated_milestone.status = MilestoneStatus::Approved;
                updated_milestone.approved_at = current_time;
                escrow.milestones.set(i, updated_milestone);
            }
        }

        escrow.state = EscrowState::Completed;
        env.storage().instance().set(&DataKey::Escrow, &escrow);
        env.events().publish(
            (String::from_str(&env, "EscrowAutoReleased"),),
            (escrow_id, current_time),
        );
    }

    pub fn get_escrow(env: Env) -> Escrow {
        env.storage().instance().get(&DataKey::Escrow).expect("Escrow not found")
    }

    pub fn get_milestone(env: Env, milestone_index: u32) -> Milestone {
        let escrow: Escrow = env.storage().instance().get(&DataKey::Escrow).expect("Escrow not found");
        escrow.milestones.get(milestone_index).expect("Invalid milestone index")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    #[test]
    fn test_create_escrow() {
        let env = Env::default();
        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContract::new(&env, &contract_id);
        let client_addr = Address::generate(&env);
        let freelancer_addr = Address::generate(&env);
        let token_addr = Address::generate(&env);
        env.mock_all_auths();

        let mut amounts = Vec::new(&env);
        amounts.push_back(1000);
        amounts.push_back(2000);

        client.create_escrow(&String::from_str(&env, "escrow-1"), &client_addr, &freelancer_addr, &token_addr, &amounts, &3);

        let escrow = client.get_escrow();
        assert_eq!(escrow.client, client_addr);
        assert_eq!(escrow.freelancer, freelancer_addr);
        assert_eq!(escrow.total_amount, 3000);
        assert_eq!(escrow.milestones.len(), 2);
        assert_eq!(escrow.state, EscrowState::Created);
    }
}
