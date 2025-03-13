import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import {
    AppBar,
    Box,
    Button,
    Container,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Menu,
    MenuItem,
    Link as MuiLink,
    Slide,
    Toolbar,
    useMediaQuery,
    useScrollTrigger,
    useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
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

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleColorMode } = useColorMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
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

  const handleLogout = async () => {
    try {
      await authService.logout();
      // Clear any stored user data
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
      
      // Set GUEST role explicitly
      localStorage.setItem('userRole', 'GUEST');
      
      // Update component state
      setIsLoggedIn(false);
      setUserRole('GUEST');
      
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

  const menuItems = [
    { label: 'Beranda', href: '#home', path: '/home' },
    { label: 'Tentang Kami', href: '#about', path: '/about' },
    { label: 'Layanan', href: '#services', path: '/services' },
    { label: 'Karir', href: '#prinsip', path: '/careers' },
    { label: 'Kontak', href: '#contact', path: '/contact' },
  ];

  // Use path or href based on login status
  const getMenuItemDestination = (item) => {
    return isLoggedIn ? item.path : item.href;
  };

  // Dashboard link based on user role - now always returns /home
  const getDashboardLink = () => {
    return '/home';
    
    /* Previous role-based logic
    if (!userRole) return '/';
    
    switch(userRole) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'RECRUITER':
        return '/recruiter/dashboard';
      case 'GENERAL_MANAGER':
        return '/gm/dashboard';
      case 'CANDIDATE':
        return '/candidate/dashboard';
      case 'KOORDINATOR_LAPANGAN':
        return '/korlap/dashboard';
      default:
        return '/';
    }
    */
  };

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
            {isLoggedIn ? (
              <ListItemButton component={Link} to={item.path}>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ) : (
              <ListItemButton component="a" href={item.href}>
                <ListItemText primary={item.label} />
              </ListItemButton>
            )}
          </ListItem>
        ))}
        {/* Login/Dashboard button for mobile */}
        <ListItem disablePadding>
          {isLoggedIn ? (
            <ListItemButton component={Link} to={getDashboardLink()}>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          ) : (
            <ListItemButton component={Link} to="/login">
              <ListItemText primary="Masuk" />
            </ListItemButton>
          )}
        </ListItem>
        {/* Logout button for mobile (only if logged in) */}
        {isLoggedIn && (
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
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

  const renderMobileMenu = (
    <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
      {drawerContent}
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
      <MenuItem component={Link} to={getDashboardLink()} onClick={handleMenuClose}>Dashboard</MenuItem>
      <MenuItem onClick={handleLogout}>Keluar</MenuItem>
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
                      component={isLoggedIn ? Link : 'a'}
                      to={isLoggedIn ? item.path : undefined}
                      href={isLoggedIn ? undefined : item.href}
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
    </>
  );
};

export default Navbar; 