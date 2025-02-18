import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, PhoneIcon, ArrowLeftIcon } from 'lucide-react'
import { RideProgress } from './ride-progress'
import { Input } from "@/components/ui/input"
import { format } from 'date-fns'
import { SignaturePad } from './signature-pad'
import { useState } from 'react'

interface RideDetailViewProps {
  ride: Ride
  onRideAction: (rideId: string, action: RideStatus, miles: number) => void
  onBack: (rideId: string, newStatus: RideStatus) => void
  onMilesEdit: (rideId: string, field: string, value: string) => void
  onClose: () => void
}

interface Ride {
  id: string
  passengerName: string
  pickupAddress: string
  dropoffAddress: string
  pickupTime: string
  status: RideStatus
  phoneNumber: string
  startMiles?: number
  pickupMiles?: number
  endMiles?: number
  returnStartMiles?: number
  returnPickupMiles?: number
  returnEndMiles?: number
  startTime?: string
  endTime?: string
  returnStartTime?: string
  returnPickupTime?: string
  returnEndTime?: string
  scheduledPickupTime: string
  order: number
  signature?: string
}

type RideStatus = 
  | 'pending'
  | 'started'
  | 'picked_up'
  | 'completed'
  | 'return_pending'
  | 'return_started'
  | 'return_picked_up'
  | 'return_completed'

export function RideDetailView({
  ride,
  onRideAction,
  onBack,
  onMilesEdit,
  onClose,
}: RideDetailViewProps) {
  const [signature, setSignature] = useState<string | undefined>(ride.signature);

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData);
    // Here you would typically save the signature to your backend
    console.log('Signature saved:', signatureData);
  };

  const handleSignatureClear = () => {
    setSignature(undefined);
  };

  const renderRideActions = () => {
    if (ride.status === 'pending') {
      return (
        <div className="mt-4 flex items-center space-x-2">
          <Button 
            onClick={() => onRideAction(ride.id, 'started', ride.startMiles || 0)} 
            className="bg-red-500 hover:bg-red-600"
          >
            Start
          </Button>
          <Input
            type="text"
            placeholder="Starting Miles"
            value={ride.startMiles || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d+$/.test(value)) {
                onMilesEdit(ride.id, 'startMiles', value);
              }
            }}
            className="w-32"
          />
        </div>
      );
    }

    return (
      <div className="mt-4">
        <RideProgress
          status={ride.status}
          onPickup={(miles: number) => onRideAction(ride.id, 'picked_up', miles)}
          onComplete={(miles: number) => onRideAction(ride.id, 'completed', miles)}
          onReturnStart={(miles: number) => onRideAction(ride.id, 'return_started', miles)}
          onReturnPickup={(miles: number) => onRideAction(ride.id, 'return_picked_up', miles)}
          onReturnComplete={(miles: number) => onRideAction(ride.id, 'return_completed', miles)}
          onBack={(newStatus: RideStatus) => onBack(ride.id, newStatus)}
          savedMiles={{
            started: ride.startMiles,
            picked_up: ride.pickupMiles,
            completed: ride.endMiles,
            return_started: ride.returnStartMiles,
            return_picked_up: ride.returnPickupMiles,
            return_completed: ride.returnEndMiles
          }}
        />
      </div>
    );
  };

  const renderTripSummary = () => {
    const isFirstLegComplete = ride.status === 'completed' || ride.status === 'return_pending' || 
                              ride.status === 'return_completed';
    const isSecondLegComplete = ride.status === 'return_completed';

    if (!isFirstLegComplete && !isSecondLegComplete) return null;

    return (
      <div className="mt-6 space-y-4 bg-gray-50 p-4 rounded-lg">
        {isFirstLegComplete && (
          <div>
            <h4 className="font-semibold mb-2">Initial Trip:</h4>
            <div className="space-y-2">
              <p>Start Time: {ride.startTime ? format(new Date(ride.startTime), 'HH:mm') : 'N/A'}</p>
              <p>Start Miles: {ride.startMiles || 'N/A'}</p>
              <p>Pickup Time: {ride.pickupTime ? format(new Date(ride.pickupTime), 'HH:mm') : 'N/A'}</p>
              <p>Pickup Miles: {ride.pickupMiles || 'N/A'}</p>
              <p>End Time: {ride.endTime ? format(new Date(ride.endTime), 'HH:mm') : 'N/A'}</p>
              <p>End Miles: {ride.endMiles || 'N/A'}</p>
              {ride.startMiles !== undefined && ride.endMiles !== undefined && (
                <p className="font-bold">Initial Trip Miles: {ride.endMiles - ride.startMiles}</p>
              )}
            </div>
          </div>
        )}
        
        {isSecondLegComplete && (
          <div>
            <h4 className="font-semibold mb-2">Return Trip:</h4>
            <div className="space-y-2">
              <p>Start Time: {ride.returnStartTime ? format(new Date(ride.returnStartTime), 'HH:mm') : 'N/A'}</p>
              <p>Start Miles: {ride.returnStartMiles || 'N/A'}</p>
              <p>Pickup Time: {ride.returnPickupTime ? format(new Date(ride.returnPickupTime), 'HH:mm') : 'N/A'}</p>
              <p>Pickup Miles: {ride.returnPickupMiles || 'N/A'}</p>
              <p>End Time: {ride.returnEndTime ? format(new Date(ride.returnEndTime), 'HH:mm') : 'N/A'}</p>
              <p>End Miles: {ride.returnEndMiles || 'N/A'}</p>
              {ride.returnStartMiles !== undefined && ride.returnEndMiles !== undefined && (
                <p className="font-bold">Return Trip Miles: {ride.returnEndMiles - ride.returnStartMiles}</p>
              )}
            </div>
          </div>
        )}

        {isSecondLegComplete && ride.startMiles !== undefined && ride.returnEndMiles !== undefined && (
          <p className="font-bold text-lg">Total Trip Miles: {ride.returnEndMiles - ride.startMiles}</p>
        )}

        {isSecondLegComplete && (
          <SignaturePad
            onSave={handleSignatureSave}
            onClear={handleSignatureClear}
          />
        )}
        {signature && (
          <div className="mt-4">
            <p className="font-semibold mb-2">Member Signature:</p>
            <img src={signature} alt="Member signature" className="border rounded-lg p-2 bg-white" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ride Details</h1>
        <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">{ride.passengerName}</h3>
              <div className="flex items-center mt-2">
                <PhoneIcon className="h-4 w-4 mr-2" />
                <span>{ride.phoneNumber}</span>
              </div>
            </div>
            <Badge className="text-sm" variant={ride.status === 'pending' ? 'secondary' : 'outline'}>
              {ride.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>Scheduled Pickup: {format(new Date(ride.scheduledPickupTime), 'MMM d, yyyy HH:mm')}</span>
            </div>
            <div className="flex items-start">
              <MapPinIcon className="h-4 w-4 mr-2 mt-1" />
              <div>
                <p className="font-medium">Pickup Location</p>
                <p>{ride.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPinIcon className="h-4 w-4 mr-2 mt-1" />
              <div>
                <p className="font-medium">Dropoff Location</p>
                <p>{ride.dropoffAddress}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {renderRideActions()}
      {renderTripSummary()}
    </div>
  );
} 