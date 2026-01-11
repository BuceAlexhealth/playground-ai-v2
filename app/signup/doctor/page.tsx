
import { SimpleSignupForm } from '@/components/auth/simple-signup-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function DoctorSignup() {
    return (
        <SimpleSignupForm
            role="doctor"
            title="Doctors Clinic"
            description="Register your clinic to start issuing digital prescriptions."
            extraFields={
                <div className="space-y-2">
                    <Label htmlFor="clinic_name">Clinic Name</Label>
                    <Input id="clinic_name" name="clinic_name" placeholder="City Medical Center" required className="bg-white/50" />
                </div>
            }
        />
    )
}
