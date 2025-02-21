import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear: () => void;
  savedSignature?: string | null;
  isSignatureSaved?: boolean;
}

export function SignaturePad({ 
  onSave, 
  onClear, 
  savedSignature, 
  isSignatureSaved: initialIsSignatureSaved 
}: SignaturePadProps) {
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [isSaved, setIsSaved] = useState(initialIsSignatureSaved || false);
  const [isEmpty, setIsEmpty] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize canvas with proper dimensions
  useEffect(() => {
    const canvas = signaturePadRef.current;
    const container = containerRef.current;
    
    if (canvas && container) {
      // Set canvas dimensions to match container
      canvas.getCanvas().width = container.offsetWidth - 2;
      canvas.getCanvas().height = container.offsetHeight - 2;
    }
  }, []);

  // Display saved signature
  useEffect(() => {
    if (savedSignature && signaturePadRef.current) {
      const canvas = signaturePadRef.current;
      canvas.clear();
      
      const img = new Image();
      img.onload = () => {
        if (canvas) {
          const ctx = canvas.getCanvas().getContext('2d');
          if (ctx) {
            const canvasWidth = canvas.getCanvas().width;
            const canvasHeight = canvas.getCanvas().height;
            
            // Calculate dimensions to maintain aspect ratio
            const scale = Math.min(
              canvasWidth / img.width,
              canvasHeight / img.height
            ) * 0.9;
            
            const x = (canvasWidth - (img.width * scale)) / 2;
            const y = (canvasHeight - (img.height * scale)) / 2;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            setIsEmpty(false);
            setIsSaved(true);
          }
        }
      };
      img.src = savedSignature;
    }
  }, [savedSignature]);

  const handleBegin = () => {
    if (!isSaved) {
      setIsEmpty(false);
    }
  };

  const handleEnd = () => {
    if (signaturePadRef.current) {
      setIsEmpty(signaturePadRef.current.isEmpty());
    }
  };

  const handleSave = () => {
    const canvas = signaturePadRef.current;
    if (!canvas || canvas.isEmpty()) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
      setIsSaved(true);
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  const handleClear = () => {
    const canvas = signaturePadRef.current;
    if (canvas) {
      canvas.clear();
      onClear();
      setIsSaved(false);
      setIsEmpty(true);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Member Signature</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 bg-white mb-4">
          <div 
            ref={containerRef}
            className="h-48 bg-white relative" 
            style={{ touchAction: 'none' }}
          >
            <SignatureCanvas
              ref={signaturePadRef}
              canvasProps={{
                className: "absolute inset-0",
                style: {
                  width: '100%',
                  height: '100%',
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.375rem",
                  background: "white",
                  touchAction: 'none'
                },
                onMouseDown: handleBegin,
                onTouchStart: handleBegin,
                onMouseUp: handleEnd,
                onTouchEnd: handleEnd
              }}
            />
          </div>
        </div>
        <div className="flex justify-end items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleClear}
            disabled={isEmpty && !isSaved}
          >
            Clear
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isEmpty || isSaved}
            className={cn(
              isSaved && "bg-green-500 hover:bg-green-500"
            )}
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              "Save Signature"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
