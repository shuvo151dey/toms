import React from 'react';
import { LineChart, Line } from 'recharts';

// Purely decorative accent line (no axes/tooltip/labels) — not a rendering of
// real metric history, since none of the dashboard's summary metrics has a
// cheap, honest time-series available. A few fixed gentle-wave shapes are
// picked by `seed` so cards look distinct without implying live data.
const SHAPES = [
    [4, 7, 5, 9, 6, 10, 8, 12],
    [6, 5, 8, 6, 10, 9, 13, 11],
    [3, 6, 4, 8, 7, 11, 9, 14],
];

export default function Sparkline({ color = '#60A5FA', seed = 0, height = 40 }) {
    const shape = SHAPES[seed % SHAPES.length];
    const data = shape.map((v, i) => ({ i, v }));

    return (
        <LineChart width={90} height={height} data={data}>
            <Line
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
            />
        </LineChart>
    );
}
