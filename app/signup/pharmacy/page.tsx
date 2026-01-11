
import { SimpleSignupForm } from '@/components/auth/simple-signup-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function PharmacySignup() {
    return (
        <SimpleSignupForm
            role="pharmacist"
            title="Pharmacist Portal"
            description="Register your pharmacy to receive and manage digital orders."
            extraFields={
                <div className="space-y-2">
                    <Label htmlFor="pharmacy_name">Pharmacy Name</Label>
                    <Input id="pharmacy_name" name="pharmacy_name" placeholder="Quick Cure Pharmacy" required className="bg-white/50" />
                </div>
            }
        />
    )
}
