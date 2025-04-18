'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogClose
} from "@/components/ui/dialog";
import { UserNav } from '@/app/components/user-nav';
import {
  CarIcon,
  FileTextIcon,
  ImageIcon,
  ShieldCheckIcon,
  Wrench,
  UploadIcon,
  InfoIcon,
  Calendar,
  Clock,
  User,
  X as CloseIcon,
  Download,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import UpdateMileage from './update-mileage';

interface Vehicle {
  id: string;
  provider_id: string;
  make: string;
  model: string;
  year: string;
  license_plate: string;
  vin: string;
  status: 'active' | 'maintenance' | 'inactive';
  last_inspection_date: string | null;
  insurance_expiry: string | null;
  created_at: string;
  updated_at: string;
  mileage?: number;
}

interface VehicleDocument {
  id: string;
  vehicle_id: string;
  name: string;
  type: 'photo' | 'insurance' | 'maintenance';
  url: string;
  created_at: string;
  file_path: string;
  file_size: number;
  mime_type: string;
}

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const { isLoggedIn, isLoading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<VehicleDocument | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);
  const maintenanceInputRef = useRef<HTMLInputElement>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run the check once auth is no longer loading
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/');
        return;
      }
      
      if (!isAdmin) {
        router.push('/');
        return;
      }
      
      // Get the provider ID for the current admin
      const getProviderIdAndVehicle = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            throw new Error('No session found');
          }
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('provider_id')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) throw profileError;
          
          if (!profile?.provider_id) {
            throw new Error('No provider ID found for user');
          }
          
          setProviderId(profile.provider_id);
          
          // Fetch vehicle details
          const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', params.id)
            .single();
            
          if (vehicleError) throw vehicleError;
          
          if (!vehicleData) {
            throw new Error('Vehicle not found');
          }
          
          // Make sure this vehicle belongs to the admin's provider
          if (vehicleData.provider_id !== profile.provider_id) {
            throw new Error('You do not have permission to view this vehicle');
          }
          
          setVehicle(vehicleData);
          
          // Fetch vehicle documents
          const { data: documentData, error: documentError } = await supabase
            .from('vehicle_documents')
            .select('*')
            .eq('vehicle_id', params.id)
            .order('created_at', { ascending: false });
            
          if (documentError) {
            console.error('Error fetching documents:', documentError);
            // Don't throw here, just log the error and continue with empty documents
          } else {
            setDocuments(documentData || []);
          }
          
          setIsLoading(false);
        } catch (error: any) {
          console.error('Error fetching data:', error);
          toast.error(error.message || 'Failed to load vehicle details');
          router.push('/admin-dashboard/vehicles');
        }
      };
      
      getProviderIdAndVehicle();
    }
  }, [isLoggedIn, isAdmin, authLoading, params.id, router]);

  // Add useEffect to control the vector animation when the page loads
  useEffect(() => {
    // Start animation when component mounts
    setIsAnimating(true);
    
    // After animation completes (3 seconds), stop the animation
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setAnimationCompleted(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Add mouse move handler for wheel rotation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wheelRef.current) return;
    
    const wheelRect = wheelRef.current.getBoundingClientRect();
    const wheelCenterX = wheelRect.left + wheelRect.width / 2;
    const wheelCenterY = wheelRect.top + wheelRect.height / 2;
    
    // Calculate angle between mouse and center
    const mouseX = e.clientX - wheelCenterX;
    const mouseY = e.clientY - wheelCenterY;
    
    // Calculate rotation based on mouse position relative to center
    // We'll use a subtle effect - just enough to feel responsive
    // Dividing by 10 to make the rotation more subtle
    const rotationFactor = -0.15; // Negative for opposite direction
    const newRotation = (mouseX + mouseY) * rotationFactor;
    
    setWheelRotation(newRotation);
  };

  const handleMouseLeave = () => {
    // Reset rotation when mouse leaves
    setWheelRotation(0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'MM/dd/yyyy');
      }
      return 'Invalid date';
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="capitalize">Active</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 capitalize">Maintenance</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="capitalize">Inactive</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  const handleFileUpload = async (type: 'photo' | 'insurance' | 'maintenance', event: React.ChangeEvent<HTMLInputElement>) => {
    if (!vehicle) return;
    
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setIsUploading(true);
      
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `vehicles/${vehicle.id}/${type}/${fileName}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('vehicle-documents')
        .getPublicUrl(filePath);
        
      const publicUrl = publicUrlData.publicUrl;
      
      // Save document metadata to vehicle_documents table
      const { error: insertError } = await supabase
        .from('vehicle_documents')
        .insert({
          vehicle_id: vehicle.id,
          name: file.name,
          type: type,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          url: publicUrl
        });
        
      if (insertError) throw insertError;
      
      toast.success(`${type} document uploaded successfully`);
      
      // Refresh documents
      const { data: refreshedDocs, error: refreshError } = await supabase
        .from('vehicle_documents')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false });
        
      if (refreshError) throw refreshError;
      
      setDocuments(refreshedDocs || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      // Get document details first to get the file path
      const { data: docData, error: fetchError } = await supabase
        .from('vehicle_documents')
        .select('file_path')
        .eq('id', docId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('vehicle-documents')
        .remove([docData.file_path]);
        
      if (storageError) throw storageError;
      
      // Delete from database
      const { error: deleteError } = await supabase
        .from('vehicle_documents')
        .delete()
        .eq('id', docId);
        
      if (deleteError) throw deleteError;
      
      // Update state
      setDocuments(documents.filter(doc => doc.id !== docId));
      
      toast.success('Document deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
    }
  };

  const handleOpenDocument = (doc: VehicleDocument) => {
    setViewingDocument(doc);
    setIsDialogOpen(true);
  };

  // Add a handler for when mileage is updated
  const handleMileageUpdated = (newMileage: number) => {
    // Update the vehicle in state
    if (vehicle) {
      setVehicle({
        ...vehicle,
        mileage: newMileage
      });
    }
  };

  // If still loading auth or vehicle data, show loading spinner
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <InfoIcon className="h-12 w-12 text-red-600 mb-4" />
          <p className="text-lg text-gray-600">Vehicle not found</p>
          <Button asChild className="mt-4">
            <Link href="/admin-dashboard/vehicles">Back to Vehicles</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-12">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"
              alt="BeLoved Transportation Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold">Vehicle Details</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin-dashboard/vehicles">
              Back to Vehicles
            </Link>
          </Button>
          <UserNav />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vehicle Summary Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Vehicle Summary</CardTitle>
            <CardDescription>Basic vehicle information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div 
              className="w-48 h-48 bg-white mb-6 rounded-full flex items-center justify-center overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              ref={wheelRef}
            >
              <div 
                className="w-40 h-40 relative"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: 'transform 0.3s ease-out'
                }}
              >
                {/* Modern Steering Wheel Design */}
                <svg 
                  viewBox="0 0 200 200" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-full h-full text-gray-400"
                >
                  {/* Outer ring */}
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="80" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="15"
                    strokeLinecap="round"
                    strokeDasharray={isAnimating ? "502" : "0"}
                    strokeDashoffset={isAnimating ? "502" : "0"}
                    style={{ transition: "stroke-dashoffset 1.5s ease-in-out" }}
                  />
                  
                  {/* Inner details - spokes */}
                  <path 
                    d="M100,40 L100,70" 
                    stroke="currentColor" 
                    strokeWidth="10" 
                    strokeLinecap="round"
                    opacity={isAnimating ? 0 : 1}
                    style={{ transition: "opacity 0.5s ease-in-out 1.5s" }}
                  />
                  <path 
                    d="M100,130 L100,160" 
                    stroke="currentColor" 
                    strokeWidth="10" 
                    strokeLinecap="round"
                    opacity={isAnimating ? 0 : 1}
                    style={{ transition: "opacity 0.5s ease-in-out 1.5s" }}
                  />
                  <path 
                    d="M40,100 L70,100" 
                    stroke="currentColor" 
                    strokeWidth="10" 
                    strokeLinecap="round" 
                    opacity={isAnimating ? 0 : 1}
                    style={{ transition: "opacity 0.5s ease-in-out 1.5s" }}
                  />
                  <path 
                    d="M130,100 L160,100" 
                    stroke="currentColor" 
                    strokeWidth="10" 
                    strokeLinecap="round"
                    opacity={isAnimating ? 0 : 1}
                    style={{ transition: "opacity 0.5s ease-in-out 1.5s" }}
                  />
                  
                  {/* Center hub */}
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="20" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="6"
                    opacity={isAnimating ? 0 : 1}
                    style={{ transition: "opacity 0.5s ease-in-out 1.8s" }}
                  />
                  
                  {/* Grip details on the wheel */}
                  <path 
                    d="M160,70 A 70,70 0 0,0 130,40" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    opacity={isAnimating ? 0 : 1}
                    style={{ transition: "opacity 0.5s ease-in-out 2.0s" }}
                  />
                  <path 
                    d="M40,70 A 70,70 0 0,1 70,40" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    opacity={isAnimating ? 0 : 1}
                    style={{ transition: "opacity 0.5s ease-in-out 2.0s" }}
                  />
                  <path 
                    d="M160,130 A 70,70 0 0,1 130,160" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    opacity={isAnimating ? 0 : 1}
                    style={{ transition: "opacity 0.5s ease-in-out 2.0s" }}
                  />
                  <path 
                    d="M40,130 A 70,70 0 0,0 70,160" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    opacity={isAnimating ? 0 : 1}
                    style={{ transition: "opacity 0.5s ease-in-out 2.0s" }}
                  />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h2>
            <p className="text-xl">{vehicle.year}</p>
            <div className="mt-2">{getStatusBadge(vehicle.status)}</div>
            
            <div className="w-full mt-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mileage:</span>
                <div className="flex items-center">
                  <span className="font-medium">{vehicle.mileage?.toLocaleString() || 'Not recorded'} miles</span>
                  <UpdateMileage 
                    vehicleId={vehicle.id} 
                    currentMileage={vehicle.mileage} 
                    onMileageUpdated={handleMileageUpdated}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">License Plate:</span>
                <span className="font-medium">{vehicle.license_plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VIN:</span>
                <span className="font-mono text-sm">{vehicle.vin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Inspection:</span>
                <span>{formatDate(vehicle.last_inspection_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance Expires:</span>
                <span>{formatDate(vehicle.insurance_expiry)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href={`/admin-dashboard/vehicles?edit=${vehicle.id}`}>
                Edit Vehicle
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Tabs Section */}
        <div className="md:col-span-2">
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <InfoIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Details</span>
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Photos</span>
              </TabsTrigger>
              <TabsTrigger value="insurance" className="flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Insurance</span>
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Maintenance</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Details</CardTitle>
                  <CardDescription>
                    Complete information about this vehicle
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Make</p>
                      <p>{vehicle.make}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Model</p>
                      <p>{vehicle.model}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Year</p>
                      <p>{vehicle.year}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">License Plate</p>
                      <p>{vehicle.license_plate}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">VIN</p>
                      <p className="font-mono">{vehicle.vin}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <p>{getStatusBadge(vehicle.status)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Current Mileage</p>
                      <div className="flex items-center">
                        <p>{vehicle.mileage?.toLocaleString() || 'Not recorded'} miles</p>
                        <UpdateMileage 
                          vehicleId={vehicle.id} 
                          currentMileage={vehicle.mileage} 
                          onMileageUpdated={handleMileageUpdated}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-2">Dates & Timeline</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Last Inspection</p>
                          <p className="text-muted-foreground">{formatDate(vehicle.last_inspection_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Insurance Expiry</p>
                          <p className="text-muted-foreground">{formatDate(vehicle.insurance_expiry)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Added to System</p>
                          <p className="text-muted-foreground">{formatDate(vehicle.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Last Updated</p>
                          <p className="text-muted-foreground">{formatDate(vehicle.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Photos Tab */}
            <TabsContent value="photos">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Photos</CardTitle>
                  <CardDescription>
                    Photos of this vehicle for reference and documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={photoInputRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload('photo', e)}
                      disabled={isUploading}
                    />
                    <Button 
                      className="w-full flex items-center justify-center gap-2" 
                      disabled={isUploading}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <UploadIcon className="h-4 w-4" />
                      {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                  </div>
                  
                  {documents.filter(doc => doc.type === 'photo').length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {documents
                        .filter(doc => doc.type === 'photo')
                        .map(doc => (
                          <div 
                            key={doc.id} 
                            className="relative group aspect-square rounded-md overflow-hidden bg-gray-100 cursor-pointer"
                            onClick={() => handleOpenDocument(doc)}
                          >
                            <Image 
                              src={doc.url} 
                              alt={doc.name} 
                              fill 
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="flex gap-2">
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDocument(doc);
                                  }}
                                >
                                  View
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDocument(doc.id);
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No photos uploaded yet</p>
                      <p className="text-sm text-muted-foreground">Upload photos of the vehicle for reference</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Insurance Tab */}
            <TabsContent value="insurance">
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Documents</CardTitle>
                  <CardDescription>
                    Insurance documentation for this vehicle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={insuranceInputRef}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('insurance', e)}
                      disabled={isUploading}
                    />
                    <Button 
                      className="w-full flex items-center justify-center gap-2" 
                      disabled={isUploading}
                      onClick={() => insuranceInputRef.current?.click()}
                    >
                      <UploadIcon className="h-4 w-4" />
                      {isUploading ? 'Uploading...' : 'Upload Insurance Document'}
                    </Button>
                  </div>
                  
                  {documents.filter(doc => doc.type === 'insurance').length > 0 ? (
                    <div className="space-y-4">
                      {documents
                        .filter(doc => doc.type === 'insurance')
                        .map(doc => (
                          <div 
                            key={doc.id} 
                            className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                            onClick={() => handleOpenDocument(doc)}
                          >
                            <div className="flex items-center gap-3">
                              <FileTextIcon className="h-6 w-6 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(doc.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDocument(doc);
                                }}
                              >
                                View
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(doc.id);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <ShieldCheckIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No insurance documents uploaded yet</p>
                      <p className="text-sm text-muted-foreground">Upload insurance policy, proof of insurance, etc.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Maintenance Tab */}
            <TabsContent value="maintenance">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Records</CardTitle>
                  <CardDescription>
                    Service and maintenance history for this vehicle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={maintenanceInputRef}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('maintenance', e)}
                      disabled={isUploading}
                    />
                    <Button 
                      className="w-full flex items-center justify-center gap-2" 
                      disabled={isUploading}
                      onClick={() => maintenanceInputRef.current?.click()}
                    >
                      <UploadIcon className="h-4 w-4" />
                      {isUploading ? 'Uploading...' : 'Upload Maintenance Record'}
                    </Button>
                  </div>
                  
                  {documents.filter(doc => doc.type === 'maintenance').length > 0 ? (
                    <div className="space-y-4">
                      {documents
                        .filter(doc => doc.type === 'maintenance')
                        .map(doc => (
                          <div 
                            key={doc.id} 
                            className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                            onClick={() => handleOpenDocument(doc)}
                          >
                            <div className="flex items-center gap-3">
                              <FileTextIcon className="h-6 w-6 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(doc.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDocument(doc);
                                }}
                              >
                                View
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(doc.id);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No maintenance records uploaded yet</p>
                      <p className="text-sm text-muted-foreground">Upload service records, repairs, maintenance schedules, etc.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
          <div className="relative">
            <DialogClose className="absolute top-2 right-2 z-10">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40">
                <CloseIcon className="h-4 w-4 text-white" />
              </Button>
            </DialogClose>
            
            {viewingDocument && (
              <>
                {viewingDocument.type === 'photo' ? (
                  <div className="relative w-full h-[80vh]">
                    <Image
                      src={viewingDocument.url}
                      alt={viewingDocument.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 h-[50vh]">
                    <div className="mb-4">
                      <FileTextIcon className="h-16 w-16 text-primary mb-2" />
                      <h3 className="text-xl font-semibold text-center">{viewingDocument.name}</h3>
                    </div>
                    
                    <div className="flex gap-4 mt-4">
                      <Button onClick={() => window.open(viewingDocument.url, '_blank')} className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Open in New Tab
                      </Button>
                      <Button variant="outline" asChild className="flex items-center gap-2">
                        <a href={viewingDocument.url} download={viewingDocument.name}>
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
} 