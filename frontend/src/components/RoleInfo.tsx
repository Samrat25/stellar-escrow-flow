import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RoleInfoProps {
  role: 'buyer' | 'seller';
}

const RoleInfo = ({ role }: RoleInfoProps) => {
  if (role === 'buyer') {
    return (
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Buyer Role:</strong> You can create escrows, add milestones, fund projects, and release payments to sellers.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-6">
      <Info className="h-4 w-4" />
      <AlertDescription>
        <strong>Seller Role:</strong> You can view assigned projects, submit completed milestones, and receive payments from buyers.
      </AlertDescription>
    </Alert>
  );
};

export default RoleInfo;
