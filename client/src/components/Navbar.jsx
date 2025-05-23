import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AppsIcon from '@mui/icons-material/Apps';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import InfoIcon from '@mui/icons-material/Info';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Link as MuiLink,
  Slide,
  Toolbar,
  Typography,
  useMediaQuery,
  useScrollTrigger,
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import NotificationBell from './NotificationBell';
import { useColorMode } from './ThemeProvider';

// Hide AppBar on scroll down
function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// Define sidebar navigation items based on role
const getSidebarItems = (role) => {
  switch(role) {
    case 'ADMIN':
      return [
        { label: 'Karyawan', icon: <PeopleIcon />, path: '/admin/employees' },
        { label: 'Staf Internal', icon: <PeopleIcon />, path: '/admin/internal-staff' },
        { label: 'Publikasi Lowongan', icon: <WorkIcon />, path: '/admin/job-publications' }
      ];
    case 'RECRUITER':
      return [
        { label: 'Publikasi Lowongan', icon: <WorkIcon />, path: '/recruiter/job-publications' },
        { label: 'Kandidat', icon: <PeopleIcon />, path: '/recruiter/dashboard' },
        { label: 'Karyawan', icon: <PeopleIcon />, path: '/recruiter/employees' },
        { label: 'Penjadwalan', icon: <CalendarMonthIcon />, path: '/recruiter/scheduling' }
      ];
    case 'GENERAL_MANAGER':
      return [
        { label: 'Staf Internal', icon: <PeopleIcon />, path: '/gm/internal-staff' },
        { label: 'Vendor', icon: <BusinessIcon />, path: '/gm/vendors' },
        { label: 'Publikasi Layanan', icon: <BusinessIcon />, path: '/gm/service-publications' },
        { label: 'Publikasi Lowongan', icon: <WorkIcon />, path: '/gm/job-publications' }
      ];
    case 'CANDIDATE':
      return [
        { label: 'Portal Informasi', icon: <InfoIcon />, path: '/candidate/portal-informasi' }
      ];
    case 'KOORDINATOR_LAPANGAN':
      return [
        { label: 'Karyawan', icon: <PeopleIcon />, path: '/korlap/employees' }
      ];
    case 'KARYAWAN':
      return [
        { label: 'Penugasan', icon: <AssignmentIcon />, path: '/karyawan/assignments' }
      ];
    case 'VENDOR':
    case 'GUEST':
    default:
      return []; // No sidebar items for VENDOR/GUEST
  }
};

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleColorMode } = useColorMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = () => {
      // Better way to check if user is logged in - look for user data in localStorage
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('userRole');
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setIsLoggedIn(true);
          setUserRole(user.role);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setIsLoggedIn(false);
          setUserRole(storedRole || 'GUEST');
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(storedRole || 'GUEST');
      }
    };
    
    checkLoginStatus();
    
    // Set up an interval to check login status periodically
    const intervalId = setInterval(checkLoginStatus, 2000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const handleScroll = () => {
    const offset = window.scrollY;
    if (offset > 50) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const confirmLogout = () => {
    setLogoutDialogOpen(true);
    // Close any open menus
    handleMenuClose();
  };

  const cancelLogout = () => {
    setLogoutDialogOpen(false);
  };

  const handleLogout = async () => {
    try {
      setLogoutDialogOpen(false);
      await authService.logout();
      // Clear any stored user data
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
      
      // Set GUEST role explicitly
      localStorage.setItem('userRole', 'GUEST');
      
      // Update component state
      setIsLoggedIn(false);
      setUserRole('GUEST');
      
      // Close sidebar if open
      setSidebarOpen(false);
      
      // Redirect to home page
      navigate('/home');
      
      // Close the menu
      handleMenuClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { label: 'Beranda', href: '#home', path: '/home' },
    { label: 'Tentang Kami', href: '#about', path: '/home#about' },
    { label: 'Layanan', href: '#services', path: '/layanan' },
    { label: 'Karir', href: '#prinsip', path: '/lowongan' },
    { label: 'Kontak', href: '#contact', path: '/home#contact' },
  ];

  // Use path or href based on login status
  const getMenuItemDestination = (item) => {
    // Always use path for Layanan and Karir, use login-based routing for others
    if (item.label === 'Layanan' || item.label === 'Karir') {
      return item.path;
    }
    // For home-based links (Beranda, Tentang Kami, Kontak), always use path to ensure proper navigation
    if (item.label === 'Beranda' || item.label === 'Tentang Kami' || item.label === 'Kontak') {
      return item.path;
    }
    return isLoggedIn ? item.path : item.href;
  };

  // Dashboard link based on user role - now always returns /home
  const getDashboardLink = () => {
    switch(userRole) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'RECRUITER':
        return '/recruiter/dashboard';
      case 'GENERAL_MANAGER':
        return '/gm/dashboard';
      case 'CANDIDATE':
        return '/candidate/portal-informasi';
      case 'KOORDINATOR_LAPANGAN':
        return '/korlap/dashboard';
      case 'KARYAWAN':
        return '/karyawan/dashboard';
      case 'VENDOR':
        return '/vendor/dashboard';
      default:
        return '/home';
    }
  };

  // Get the sidebar navigation items based on role
  const sidebarItems = getSidebarItems(userRole);

  // Should show sidebar button?
  const shouldShowSidebarButton = isLoggedIn && sidebarItems.length > 0;

  // Mobile drawer content
  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton component={Link} to={getMenuItemDestination(item)}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        {/* Login button or authenticated options for mobile */}
        {isLoggedIn ? (
          <>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/profil">
                <ListItemText primary="Profil" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to={getDashboardLink()}>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/login">
              <ListItemText primary="Masuk" />
            </ListItemButton>
          </ListItem>
        )}
        {/* Logout button for mobile (only if logged in) */}
        {isLoggedIn && (
          <ListItem disablePadding>
            <ListItemButton onClick={confirmLogout}>
              <ListItemText primary="Keluar" />
              <LogoutIcon />
            </ListItemButton>
          </ListItem>
        )}
        {/* Theme toggle for mobile */}
        <ListItem disablePadding>
          <ListItemButton onClick={toggleColorMode}>
            <ListItemText primary={`Beralih ke Mode ${mode === 'light' ? 'Gelap' : 'Terang'}`} />
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Sidebar content based on user role
  const sidebarContent = (
    <Box
      sx={{ 
        width: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      role="presentation"
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2
      }}>
        <Typography variant="h6">Menu</Typography>
        <IconButton onClick={toggleSidebar}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {userRole}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {sidebarItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton component={Link} to={item.path} onClick={toggleSidebar}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button 
          variant="outlined" 
          fullWidth 
          startIcon={<LogoutIcon />}
          onClick={confirmLogout}
          sx={{ mt: 1 }}
        >
          Keluar
        </Button>
      </Box>
    </Box>
  );

  const renderMobileMenu = (
    <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
      {drawerContent}
    </Drawer>
  );

  const renderSidebar = (
    <Drawer 
      anchor="right" 
      open={sidebarOpen} 
      onClose={toggleSidebar}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '80%', sm: 280 },
          boxSizing: 'border-box',
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem component={Link} to="/profil" onClick={handleMenuClose}>Profil</MenuItem>
      <MenuItem component={Link} to={getDashboardLink()} onClick={handleMenuClose}>Dashboard</MenuItem>
      <MenuItem onClick={confirmLogout}>Keluar</MenuItem>
    </Menu>
  );

  // Debug
  console.log("Login status:", isLoggedIn);
  console.log("User role:", userRole);

  return (
    <>
      <HideOnScroll>
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: scrolled 
              ? theme.palette.background.paper 
              : 'transparent',
            boxShadow: scrolled ? theme.shadows[4] : 'none',
            transition: 'all 0.3s ease',
            backdropFilter: scrolled ? 'blur(10px)' : 'none',
            zIndex: 1100, // Ensure navbar is above other content
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              {/* Logo */}
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: { xs: 1, md: 0 } }}>
                <MuiLink href="/">
                  <img
                    src="/assets/baslogo.png"
                    alt="BAS Logo"
                    style={{ 
                      width: 100, 
                      height: 'auto',
                      filter: scrolled 
                        ? 'none'
                        : (mode === 'dark' ? 'brightness(0) invert(1)' : 'none')
                    }}
                  />
                </MuiLink>
              </Box>

              {/* Desktop Navigation */}
              {!isMobile && (
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                  {menuItems.map((item) => (
                    <Button
                      key={item.label}
                      color="inherit"
                      component={Link}
                      to={getMenuItemDestination(item)}
                      sx={{ 
                        mx: 1,
                        color: scrolled 
                          ? theme.palette.text.primary 
                          : (mode === 'dark' ? '#fff' : '#000'),
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Box>
              )}

              {/* Right side buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* Theme toggle */}
                <IconButton
                  onClick={toggleColorMode}
                  color="inherit"
                  sx={{ 
                    color: scrolled 
                      ? theme.palette.text.primary 
                      : (mode === 'dark' ? '#fff' : '#000')
                  }}
                >
                  {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                </IconButton>

                {/* Notification Bell */}
                {userRole === 'GENERAL_MANAGER' && (
                  <IconButton
                    size="large"
                    edge="end"
                    aria-label="notification"
                    color="inherit"
                    sx={{ 
                      ml: 1,
                      color: scrolled 
                        ? theme.palette.text.primary 
                        : (mode === 'dark' ? '#fff' : '#000')
                    }}
                  >
                    <NotificationBell />
                  </IconButton>
                )}

                {/* Sidebar button - only show if logged in and role has sidebar items */}
                {shouldShowSidebarButton && (
                  <IconButton
                    size="large"
                    edge="end"
                    aria-label="open sidebar menu"
                    onClick={toggleSidebar}
                    color="inherit"
                    sx={{ 
                      ml: 1,
                      color: scrolled 
                        ? theme.palette.text.primary 
                        : (mode === 'dark' ? '#fff' : '#000')
                    }}
                  >
                    <AppsIcon />
                  </IconButton>
                )}

                {/* Login/Profile button */}
                {isLoggedIn ? (
                  <IconButton
                    size="large"
                    edge="end"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleProfileMenuOpen}
                    color="inherit"
                    sx={{ 
                      ml: 2,
                      color: scrolled 
                        ? theme.palette.text.primary 
                        : (mode === 'dark' ? '#fff' : '#000')
                    }}
                  >
                    <AccountCircleIcon />
                  </IconButton>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AccountCircleIcon />}
                    sx={{ 
                      ml: 2,
                      display: { xs: 'none', sm: 'flex' } 
                    }}
                    component={Link}
                    to="/login"
                  >
                    Masuk
                  </Button>
                )}

                {/* Mobile menu button */}
                {isMobile && (
                  <IconButton
                    size="large"
                    edge="end"
                    color="inherit"
                    aria-label="menu"
                    onClick={toggleDrawer(true)}
                    sx={{ 
                      color: scrolled 
                        ? theme.palette.text.primary 
                        : (mode === 'dark' ? '#fff' : '#000')
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                )}
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>
      {/* Add toolbar for spacing - this creates space at the top for the fixed navbar */}
      <Toolbar />
      {renderMobileMenu}
      {renderMenu}
      {renderSidebar}

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={cancelLogout}
      >
        <DialogTitle>Konfirmasi Keluar</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin keluar dari akun Anda?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelLogout} color="inherit">
            Batal
          </Button>
          <Button onClick={handleLogout} color="primary" variant="contained">
            Ya, Keluar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar; 