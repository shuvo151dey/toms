import React from 'react';
import { Box, Typography } from '@mui/material';

export default function EmptyState({ icon, title, subtitle }) {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            py={5}
            px={2}
        >
            <Box
                sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
                    color: 'text.secondary',
                    mb: 1.5,
                }}
            >
                {icon}
            </Box>
            <Typography variant="body1" fontWeight={600}>{title}</Typography>
            {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
    );
}
