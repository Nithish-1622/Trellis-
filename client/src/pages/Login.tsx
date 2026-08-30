import SplitAuthLayout from '../components/auth-components/SplitAuthLayout';
import LoginForm from '../components/auth-components/LoginForm';

const Login: React.FC = () => {
    return (
        <SplitAuthLayout>
            <LoginForm />
        </SplitAuthLayout>
    );
};

export default Login;
