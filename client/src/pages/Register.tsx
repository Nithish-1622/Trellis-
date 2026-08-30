import SplitAuthLayout from '../components/auth-components/SplitAuthLayout';
import RegisterForm from '../components/auth-components/RegisterForm';

const Register: React.FC = () => {
    return (
        <SplitAuthLayout variant="register">
            <RegisterForm />
        </SplitAuthLayout>
    );
};

export default Register;
