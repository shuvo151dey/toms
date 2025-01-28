import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ roles, children }) => {
    const userRoles = useSelector((state) => state.auth.roles);

    const hasAccess = roles.some((role) => userRoles.includes(role));
    return hasAccess ? children : <Navigate to="/unauthorized" />;
};

export default ProtectedRoute;
