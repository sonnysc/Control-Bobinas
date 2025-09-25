// src/components/styles/modalStyles.js

export const modalStyles = {
  paper: {
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#2196f3',
    color: 'white',
    textAlign: 'center',
    py: 3,
    fontSize: '1.2rem',
    fontWeight: 600,
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.2)',
      transform: 'scale(1.1)'
    },
    transition: 'all 0.2s ease'
  },
  button: {
    borderRadius: '8px',
    px: 3,
    py: 1,
    fontWeight: 600
  }
};