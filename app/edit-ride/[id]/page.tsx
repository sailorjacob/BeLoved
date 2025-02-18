import { EditRideForm } from '../../components/edit-ride-form'
import { UserNav } from '../../components/user-nav'

export default function EditRidePage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Edit Ride</h1>
        <UserNav />
      </div>
      <EditRideForm id={params.id} />
    </main>
  )
}

