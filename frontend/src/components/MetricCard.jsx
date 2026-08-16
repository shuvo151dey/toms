import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import Sparkline from './Sparkline';

export default function MetricCard({ title, value, subtitle, icon, color = 'primary.main', sparkSeed = 0 }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: (theme) => theme.palette.mode === 'dark'
                                ? `rgba(${color === 'success.main' ? '34,197,94' : color === 'secondary.main' ? '167,139,250' : '96,165,250'},0.15)`
                                : `rgba(${color === 'success.main' ? '22,163,74' : color === 'secondary.main' ? '139,92,246' : '59,130,246'},0.1)`,
                            color,
                        }}
                    >
                        {icon}
                    </Box>
                    <Sparkline color={color === 'success.main' ? '#22C55E' : color === 'secondary.main' ? '#A78BFA' : '#60A5FA'} seed={sparkSeed} />
                </Box>
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 1.5, letterSpacing: 1 }}>
                    {title}
                </Typography>
                <Typography variant="h5" color={color} fontWeight={700}>{value}</Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
