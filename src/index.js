import React from 'react';
import ReactDOM from 'react-dom/client';
import {CssBaseline, ThemeProvider, createTheme} from "@mui/material";
import App from './App';
import './index.css';

const theme = createTheme({
    palette: {
        primary: {
            main: '#6534df',
        },
        secondary: {
            main: '#a29bfe',
        },
        background: {
            default: '#f9f9f9',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
    },

    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                },
            },
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
    },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
        </ThemeProvider>
    </React.StrictMode>
);