import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Star, Award } from 'lucide-react';
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
import { useToast } from "@/components/ui/use-toast";

interface CrewCarwashCheckinProps {
  driverId: string;
}

export function CrewCarwashCheckin({ driverId }: CrewCarwashCheckinProps) {
  const { toast } = useToast();
  const [completedStars, setCompletedStars] = useState(0);
  const [totalStarsCount, setTotalStarsCount] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalStars = 5;

  useEffect(() => {
    console.log('CrewCarwashCheckin mounted with driverId:', driverId);
    fetchCarwashCheckins();
    fetchDriverStats();
  }, [driverId]);

  const fetchDriverStats = async () => {
    try {
      console.log('Fetching driver stats for driver:', driverId);
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('total_stars, weekly_stars_count')
        .eq('id', driverId)
        .single();

      if (error) {
        console.error('Error fetching driver stats:', error);
        return;
      }

      console.log('Driver stats data:', data);
      if (data) {
        setTotalStarsCount(data.total_stars || 0);
        setCompletedStars(data.weekly_stars_count || 0);
      }
    } catch (err) {
      console.error('Unexpected error fetching driver stats:', err);
    }
  };

  const fetchCarwashCheckins = async () => {
    try {
      console.log('Fetching carwash checkins for driver:', driverId);
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
        setError(error.message);
        toast({
          title: "Error",
          description: "Failed to fetch carwash check-ins",
          variant: "destructive",
        });
        return;
      }

      console.log('Carwash checkins data:', data);
      // If we got data from the weekly checkins but not from driver_profile
      if (data && data.length > 0 && completedStars === 0) {
        setCompletedStars(data.length);
      }
      setError(null);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCheckin = async () => {
    if (completedStars >= totalStars) return;
    
    try {
      setIsLoading(true);
      console.log('Recording carwash checkin for driver:', driverId);
      
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
        setError(error.message);
        toast({
          title: "Error",
          description: "Failed to record carwash check-in",
          variant: "destructive",
        });
        return;
      }

      console.log('Successfully recorded carwash checkin');
      setCompletedStars(prev => Math.min(prev + 1, totalStars));
      setTotalStarsCount(prev => prev + 1);
      setError(null);
      toast({
        title: "Success",
        description: "Carwash check-in recorded successfully",
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
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
          {isLoading ? "Processing..." : "Check In"}
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
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {completedStars} of {totalStars} weekly car washes completed
        </p>
        <div className="flex items-center gap-1">
          <Award className="w-5 h-5 text-blue-500" />
          <p className="text-sm font-medium text-blue-600">{totalStarsCount} total stars</p>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Weekly stars reset every Sunday at midnight. Your total stars are accumulated for your entire career.
      </p>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

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