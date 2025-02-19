import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, PhoneIcon, ArrowLeftIcon, DownloadIcon } from 'lucide-react'
import { RideProgress } from './ride-progress'
import { Input } from "@/components/ui/input"
import { format } from 'date-fns'
import { SignaturePad } from './signature-pad'
import { useState } from 'react'
import jsPDF from 'jspdf'

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

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add BeLoved Transportation header with logo
    const logoUrl = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png";
    
    // Add logo with proper dimensions and positioning
    // Original logo is wider than tall, so adjust dimensions to match header text height (approximately 12px)
    doc.addImage(logoUrl, 'PNG', 20, 15, 24, 12);
    
    // Add header text with adjusted positioning - all on one line
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("BeLoved Transportation", 50, 25);
    
    // Reset font for rest of document
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    // Add trip details - moved up by 5 pixels
    doc.text(`Trip ID: ${ride.id}`, 20, 45);
    doc.text(`Member Name: ${ride.passengerName}`, 20, 55);
    
    // Format and separate times
    const scheduledTime = format(new Date(ride.scheduledPickupTime), 'h:mm a');
    // Calculate "To Be Ready Time" (45 minutes before scheduled time)
    const toBeReadyDate = new Date(ride.scheduledPickupTime);
    toBeReadyDate.setMinutes(toBeReadyDate.getMinutes() - 45);
    const toBeReadyTime = format(toBeReadyDate, 'h:mm a');
    
    // Add times side by side - moved up by 5 pixels
    doc.text("To Be Ready Time:", 20, 75);
    doc.text(`${toBeReadyTime}`, 20, 82);
    doc.text("Appointment Time:", 105, 75);
    doc.text(`${scheduledTime}`, 105, 82);
    
    // Add addresses side by side - moved up by 5 pixels
    doc.text("Pickup Address:", 20, 95);
    doc.text("Drop-off Address:", 105, 95);
    const pickupLines = doc.splitTextToSize(ride.pickupAddress, 75);
    const dropoffLines = doc.splitTextToSize(ride.dropoffAddress, 75);
    doc.text(pickupLines, 20, 102);
    doc.text(dropoffLines, 105, 102);

    // Adjust all subsequent Y positions
    const yOffset = 30; // Reduced from 35

    // Initial Trip Completion Information Table
    doc.setFont('helvetica', 'bold');
    doc.text("Initial Trip Completion Information:", 20, 120 + yOffset);
    
    // Draw table for initial trip - more compact
    const initialTableY = 125 + yOffset;
    const rowHeight = 18; // Increased from 16
    const tableWidth = 120;
    const colWidth = tableWidth / 3;
    
    // Calculate table positions
    const tableStartX = 20;
    const tableEndX = tableStartX + tableWidth;
    const col1X = tableStartX + colWidth;
    const col2X = tableStartX + (colWidth * 2);
    
    // Draw table background for headers
    doc.setFillColor(240, 240, 240);
    doc.rect(tableStartX, initialTableY, colWidth, 8, 'F');
    doc.rect(col1X, initialTableY, colWidth, 8, 'F');
    doc.rect(col2X, initialTableY, colWidth, 8, 'F');
    
    // Horizontal lines for main table structure
    doc.line(tableStartX, initialTableY, tableEndX, initialTableY);
    doc.line(tableStartX, initialTableY + 8, tableEndX, initialTableY + 8);
    doc.line(tableStartX, initialTableY + rowHeight, tableEndX, initialTableY + rowHeight);
    
    // Add separator lines between time and mileage in each column
    doc.line(tableStartX, initialTableY + 12, tableEndX, initialTableY + 12);
    
    // Vertical lines
    doc.line(tableStartX, initialTableY, tableStartX, initialTableY + rowHeight);
    doc.line(col1X, initialTableY, col1X, initialTableY + rowHeight);
    doc.line(col2X, initialTableY, col2X, initialTableY + rowHeight);
    doc.line(tableEndX, initialTableY, tableEndX, initialTableY + rowHeight);
    
    // Headers - centered and bold with background
    doc.setFont('helvetica', 'bold');
    doc.text("Start", tableStartX + 15, initialTableY + 6);
    doc.text("Pickup", col1X + 15, initialTableY + 6);
    doc.text("End", col2X + 15, initialTableY + 6);
    
    // Initial trip data
    const startTime = ride.startTime ? format(new Date(ride.startTime), 'h:mm a') : 'N/A';
    const pickupTime = ride.pickupTime ? format(new Date(ride.pickupTime), 'h:mm a') : 'N/A';
    const endTime = ride.endTime ? format(new Date(ride.endTime), 'h:mm a') : 'N/A';
    
    // Data with clear separation between time and miles - normal text
    doc.setFont('helvetica', 'normal');
    doc.text(`Time: ${startTime}`, tableStartX + 2, initialTableY + 12.5);
    doc.text(`Miles: ${ride.startMiles || 'N/A'}`, tableStartX + 2, initialTableY + 16.8);
    doc.text(`Time: ${pickupTime}`, col1X + 2, initialTableY + 12.5);
    doc.text(`Miles: ${ride.pickupMiles || 'N/A'}`, col1X + 2, initialTableY + 16.8);
    doc.text(`Time: ${endTime}`, col2X + 2, initialTableY + 12.5);
    doc.text(`Miles: ${ride.endMiles || 'N/A'}`, col2X + 2, initialTableY + 16.8);

    // Return Trip Completion Information Table
    doc.setFont('helvetica', 'bold');
    doc.text("Return Trip Completion Information:", 20, 155 + yOffset);
    
    // Draw table for return trip - more compact
    const returnTableY = 160 + yOffset;
    
    // Draw table background for headers
    doc.setFillColor(240, 240, 240);
    doc.rect(tableStartX, returnTableY, colWidth, 8, 'F');
    doc.rect(col1X, returnTableY, colWidth, 8, 'F');
    doc.rect(col2X, returnTableY, colWidth, 8, 'F');
    
    // Horizontal lines for main table structure
    doc.line(tableStartX, returnTableY, tableEndX, returnTableY);
    doc.line(tableStartX, returnTableY + 8, tableEndX, returnTableY + 8);
    doc.line(tableStartX, returnTableY + rowHeight, tableEndX, returnTableY + rowHeight);
    
    // Add separator lines between time and mileage in each column
    doc.line(tableStartX, returnTableY + 12, tableEndX, returnTableY + 12);
    
    // Vertical lines
    doc.line(tableStartX, returnTableY, tableStartX, returnTableY + rowHeight);
    doc.line(col1X, returnTableY, col1X, returnTableY + rowHeight);
    doc.line(col2X, returnTableY, col2X, returnTableY + rowHeight);
    doc.line(tableEndX, returnTableY, tableEndX, returnTableY + rowHeight);
    
    // Headers - centered and bold with background
    doc.setFont('helvetica', 'bold');
    doc.text("Start", tableStartX + 15, returnTableY + 6);
    doc.text("Pickup", col1X + 15, returnTableY + 6);
    doc.text("End", col2X + 15, returnTableY + 6);
    
    // Return trip data
    const returnStartTime = ride.returnStartTime ? format(new Date(ride.returnStartTime), 'h:mm a') : 'N/A';
    const returnPickupTime = ride.returnPickupTime ? format(new Date(ride.returnPickupTime), 'h:mm a') : 'N/A';
    const returnEndTime = ride.returnEndTime ? format(new Date(ride.returnEndTime), 'h:mm a') : 'N/A';
    
    // Data with clear separation between time and miles - normal text
    doc.setFont('helvetica', 'normal');
    doc.text(`Time: ${returnStartTime}`, tableStartX + 2, returnTableY + 12.5);
    doc.text(`Miles: ${ride.returnStartMiles || 'N/A'}`, tableStartX + 2, returnTableY + 16.8);
    doc.text(`Time: ${returnPickupTime}`, col1X + 2, returnTableY + 12.5);
    doc.text(`Miles: ${ride.returnPickupMiles || 'N/A'}`, col1X + 2, returnTableY + 16.8);
    doc.text(`Time: ${returnEndTime}`, col2X + 2, returnTableY + 12.5);
    doc.text(`Miles: ${ride.returnEndMiles || 'N/A'}`, col2X + 2, returnTableY + 16.8);

    // Total Trip Information
    if (ride.startMiles !== undefined && ride.returnEndMiles !== undefined) {
      doc.text(`Total Trip Miles: ${ride.returnEndMiles - ride.startMiles}`, 20, 195 + yOffset);
    }
    
    // Add signature if available
    if (signature) {
      doc.text("Member Signature:", 20, 210 + yOffset);
      doc.addImage(signature, 'PNG', 20, 220 + yOffset, 50, 20);
    }
    
    // Format date for bottom left of page
    const fullDate = format(new Date(ride.scheduledPickupTime), 'EEEE, MMMM d, yyyy');
    doc.text(fullDate, 20, 275);
    
    // Save the PDF
    doc.save(`trip-log-${ride.id}.pdf`);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePDF} className="flex items-center gap-2">
            <DownloadIcon className="h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
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