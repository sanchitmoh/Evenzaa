// Utility function to redirect users based on their role
export const redirectAfterLogin = (role: string | undefined, navigate: any, targetPath?: string): void => {
  // If a specific target path is provided, go there
  if (targetPath && targetPath !== '/login' && targetPath !== '/register') {
    navigate(targetPath);
    return;
  }

  // Otherwise, use role-based redirection
  switch(role?.toUpperCase()) {
    case 'ADMIN':
      navigate('/admin');
      break;
    case 'ORGANIZER':
      navigate('/organizer/dashboard');
      break;
    case 'USER':
      navigate('/dashboard');
      break;
    default:
      
        // Added fallback for when role is undefined or not recognized
        console.log("Role not recognized, redirecting to home:", role);
        navigate('/home');
        break;
  }
};