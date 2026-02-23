import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Loader2, FileText, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface IPFSUploadProps {
  onUploadComplete: (data: {
    cid: string;
    url: string;
    filename?: string;
    size?: number;
  }) => void;
  disabled?: boolean;
}

const IPFSUpload = ({ onUploadComplete, disabled }: IPFSUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [ipfsCid, setIpfsCid] = useState('');
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/ipfs/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      setUploadResult(result);
      toast.success('File uploaded to IPFS!', {
        description: `CID: ${result.cid.slice(0, 20)}...`
      });

      onUploadComplete(result);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!textContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/ipfs/upload-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textContent,
          name: 'submission.txt'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      setUploadResult(result);
      toast.success('Content uploaded to IPFS!', {
        description: `CID: ${result.cid.slice(0, 20)}...`
      });

      onUploadComplete(result);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload content');
    } finally {
      setUploading(false);
    }
  };

  const handleCidSubmit = async () => {
    if (!ipfsCid.trim()) {
      toast.error('Please enter an IPFS CID');
      return;
    }

    setUploading(true);
    try {
      // Validate CID
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/ipfs/validate/${ipfsCid}`);
      
      if (!response.ok) {
        throw new Error('Invalid CID');
      }

      const result = await response.json();
      
      if (!result.valid) {
        throw new Error('Invalid IPFS CID format');
      }

      setUploadResult({
        cid: result.cid,
        url: result.url
      });

      toast.success('IPFS CID validated!');
      onUploadComplete({
        cid: result.cid,
        url: result.url
      });
    } catch (error: any) {
      console.error('CID validation error:', error);
      toast.error(error.message || 'Invalid CID');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="text">Text Content</TabsTrigger>
            <TabsTrigger value="cid">Existing CID</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <div className="mt-2">
                <label htmlFor="file" className="flex items-center justify-center w-full h-32 px-4 transition bg-muted border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none">
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : 'Click to upload file'}
                    </span>
                    {selectedFile && (
                      <span className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={disabled || uploading}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Max 50MB • PDF, ZIP, Images, Videos, Documents
              </p>
            </div>

            <Button 
              onClick={handleFileUpload} 
              disabled={!selectedFile || disabled || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading to IPFS...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload to IPFS
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div>
              <Label htmlFor="text">Work Description & Links</Label>
              <Textarea
                id="text"
                placeholder="Describe your completed work, include links to deliverables, or paste your submission content..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={disabled || uploading}
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-2">
                This content will be stored on IPFS
              </p>
            </div>

            <Button 
              onClick={handleTextUpload} 
              disabled={!textContent.trim() || disabled || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading to IPFS...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Text to IPFS
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="cid" className="space-y-4">
            <div>
              <Label htmlFor="cid">IPFS CID</Label>
              <Input
                id="cid"
                placeholder="Qm... or b..."
                value={ipfsCid}
                onChange={(e) => setIpfsCid(e.target.value)}
                disabled={disabled || uploading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                If you've already uploaded to IPFS, enter the CID here
              </p>
            </div>

            <Button 
              onClick={handleCidSubmit} 
              disabled={!ipfsCid.trim() || disabled || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Use This CID
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {uploadResult && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Uploaded to IPFS Successfully
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1 font-mono break-all">
                  CID: {uploadResult.cid}
                </p>
                {uploadResult.filename && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    File: {uploadResult.filename}
                  </p>
                )}
                <a
                  href={uploadResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on IPFS
                </a>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IPFSUpload;
