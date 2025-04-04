import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Star } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/lib/supabase';

interface CrewCarwashCheckinProps {
  driverId: string;
}

export function CrewCarwashCheckin({ driverId }: CrewCarwashCheckinProps) {
  const [completedStars, setCompletedStars] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const totalStars = 5;

  useEffect(() => {
    fetchCarwashCheckins();
  }, [driverId]);

  const fetchCarwashCheckins = async () => {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const { data, error } = await supabase
      .from('carwash_checkins')
      .select('*')
      .eq('driver_id', driverId)
      .gte('created_at', startOfWeek.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching carwash checkins:', error);
      return;
    }

    setCompletedStars(data?.length || 0);
  };

  const handleCheckin = async () => {
    if (completedStars >= totalStars) return;
    
    setIsLoading(true);
    const { error } = await supabase
      .from('carwash_checkins')
      .insert([
        {
          driver_id: driverId,
          created_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      console.error('Error recording carwash checkin:', error);
    } else {
      setCompletedStars(prev => Math.min(prev + 1, totalStars));
    }
    
    setIsLoading(false);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Crew Carwash Check-ins</h3>
        <Button
          onClick={() => setIsDialogOpen(true)}
          disabled={completedStars >= totalStars || isLoading}
          variant="outline"
          className="ml-4"
        >
          Check In
        </Button>
      </div>

      <div className="flex gap-2">
        {[...Array(totalStars)].map((_, index) => (
          <Star
            key={index}
            className={cn(
              "w-8 h-8 transition-all duration-300",
              index < completedStars
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300"
            )}
          />
        ))}
      </div>
      
      <p className="text-sm text-gray-500">
        {completedStars} of {totalStars} weekly car washes completed
      </p>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Crew Carwash Check-in</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check in at Crew Carwash? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCheckin}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Check-in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 