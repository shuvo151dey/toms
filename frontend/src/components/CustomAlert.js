import { useEffect } from 'react';
import { Snackbar, Alert } from "@mui/material";
import { useDispatch } from 'react-redux';
import { clearAlert } from '../redux/AppSlice';

const CustomAlert = ({message = "", onClose = () => {}, type = "info"}) => {
    const dispatch = useDispatch();
    useEffect(() => {
        if(message){
            const timer = setTimeout(() => {
                dispatch(clearAlert());
            }, 5000);

            return () => clearTimeout(timer);
        }
    },[dispatch])
    return (
    <Snackbar
        open={!!message}
        autoHideDuration={5000}
        onClose={onClose}
    >
        <Alert onClose={onClose} severity={type}>
            {message}
        </Alert>
    </Snackbar>)
}

export default CustomAlert;