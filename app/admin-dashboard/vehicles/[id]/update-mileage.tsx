'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

interface UpdateMileageProps {
  vehicleId: string;
  currentMileage?: number;
  onMileageUpdated: (newMileage: number) => void;
}

export default function UpdateMileage({ 
  vehicleId, 
  currentMileage, 
  onMileageUpdated 
}: UpdateMileageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mileage, setMileage] = useState<string>(currentMileage?.toString() || '');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleUpdateMileage = async () => {
    if (!mileage || isNaN(Number(mileage))) {
      toast.error('Please enter a valid mileage value');
      return;
    }
    
    const mileageValue = parseInt(mileage);
    
    if (currentMileage && mileageValue < currentMileage) {
      if (!confirm('The new mileage is lower than the current mileage. Are you sure you want to continue?')) {
        return;
      }
    }
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('vehicles')
        .update({ mileage: mileageValue, updated_at: new Date().toISOString() })
        .eq('id', vehicleId);
        
      if (error) throw error;
      
      toast.success('Vehicle mileage updated successfully');
      onMileageUpdated(mileageValue);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error updating mileage:', error);
      toast.error(error.message || 'Failed to update mileage');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="ml-2"
      >
        Update
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Vehicle Mileage</DialogTitle>
            <DialogDescription>
              Enter the current mileage for this vehicle.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <label htmlFor="mileage" className="text-sm font-medium">
                Current Mileage (miles)
              </label>
              <Input 
                id="mileage"
                type="number"
                min="0"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="Enter mileage"
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isUpdating}>Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleUpdateMileage} 
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Mileage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 