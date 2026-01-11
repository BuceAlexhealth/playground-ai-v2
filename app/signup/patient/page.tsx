
import { SimpleSignupForm } from '@/components/auth/simple-signup-form'

export default function PatientSignup() {
    return (
        <SimpleSignupForm
            role="patient"
            title="Patient Portal"
            description="Create your health account to manage prescriptions and orders."
        />
    )
}
