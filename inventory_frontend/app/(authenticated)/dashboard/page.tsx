'use client';

import { useRouter } from 'next/navigation';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CardActionArea,
  Box,
  Paper,
  Container,
  Chip,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  QrCodeScanner as ScannerIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';

export default function DashboardPage() {
  const router = useRouter();

  const features = [
    {
      title: 'View Items',
      description: 'Browse and manage your inventory items',
      icon: <InventoryIcon sx={{ fontSize: 48 }} />,
      path: '/items',
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    // {
    //   title: 'Add New Item',
    //   description: 'Add a new item to your inventory',
    //   icon: <AddIcon sx={{ fontSize: 48 }} />,
    //   path: '/items',
    //   color: '#2e7d32',
    //   bgColor: '#e8f5e8',
    // },
    {
      title: 'View Alerts',
      description: 'Check inventory alerts and notifications',
      icon: <NotificationsIcon sx={{ fontSize: 48 }} />,
      path: '/alerts',
      color: '#f57c00',
      bgColor: '#fff3e0',
    },
    {
      title: 'Barcode Scanner',
      description: 'Public scanner for item usage tracking',
      icon: <ScannerIcon sx={{ fontSize: 48 }} />,
      path: '/scanner',
      color: '#7b1fa2',
      bgColor: '#f3e5f5',
    },
    {
      title: 'Usage Reports',
      description: 'View detailed usage analytics and reports',
      icon: <ReportsIcon sx={{ fontSize: 48 }} />,
      path: '/usage-reports',
      color: '#c62828',
      bgColor: '#ffebee',
    },
    {
      title: 'Quick Stats',
      description: 'Overview of your inventory metrics',
      icon: <TrendingUpIcon sx={{ fontSize: 48 }} />,
      path: '/quick-stats',
      color: '#00695c',
      bgColor: '#e0f2f1',
    },
  ];

  const handleCardClick = (feature: any) => {
    router.push(feature.path);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 6 }}>
        <Paper 
          sx={{ 
            p: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3,
            mb: 4
          }}
        >
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Welcome to Your Dashboard
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
            Manage your inventory efficiently with our comprehensive tools
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label="Real-time Tracking" 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
            />
            <Chip 
              label="Barcode Scanning" 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
            />
            <Chip 
              label="Smart Alerts" 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
            />
          </Box>
        </Paper>
      </Box>

      {/* Feature Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} lg={4} key={feature.title}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'transparent',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    borderColor: feature.color,
                  },
                }}
                onClick={() => handleCardClick(feature)}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Box 
                    sx={{ 
                      mb: 3,
                      p: 2,
                      borderRadius: '50%',
                      bgcolor: feature.bgColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                    }}
                  >
                    <Box sx={{ color: feature.color }}>
                      {feature.icon}
                    </Box>
                  </Box>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ fontWeight: 'bold', color: 'text.primary' }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

    

    </Container>
  );
} 