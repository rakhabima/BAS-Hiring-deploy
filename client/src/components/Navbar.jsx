import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
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
  Slide,
  Toolbar,
  useMediaQuery,
  useScrollTrigger,
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
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

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const menuItems = [
    { label: 'Beranda', href: '#home' },
    { label: 'Tentang Kami', href: '#about' },
    { label: 'Layanan', href: '#services' },
    { label: 'Karir', href: '#prinsip' },
    { label: 'Kontak', href: '#contact' },
  ];

  const renderMobileMenu = (
    <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
      <Box
        sx={{ width: 250 }}
        role="presentation"
        onClick={toggleDrawer(false)}
        onKeyDown={toggleDrawer(false)}
      >
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton component="a" href={item.href}>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemButton onClick={toggleColorMode}>
              <ListItemText primary={`Beralih ke Mode ${mode === 'light' ? 'Gelap' : 'Terang'}`} />
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
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
      <MenuItem onClick={handleMenuClose}>Profil</MenuItem>
      <MenuItem onClick={handleMenuClose}>Akun Saya</MenuItem>
      <MenuItem onClick={handleMenuClose}>Keluar</MenuItem>
    </Menu>
  );

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
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              {/* Logo */}
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: { xs: 1, md: 0 } }}>
                <img
                  src="/assets/baslogo.png"
                  alt="BAS Logo"
                  style={{ 
                    width: 100, 
                    height: 'auto',
                    filter: mode === 'dark' && !scrolled ? 'brightness(0) invert(1)' : 'none'
                  }}
                />
              </Box>

              {/* Desktop Navigation */}
              {!isMobile && (
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                  {menuItems.map((item) => (
                    <Button
                      key={item.label}
                      color="inherit"
                      href={item.href}
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

                {/* Login button */}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AccountCircleIcon />}
                  sx={{ 
                    ml: 2,
                    display: { xs: 'none', sm: 'flex' } 
                  }}
                >
                  Masuk
                </Button>

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
      {/* Add toolbar for spacing */}
      <Toolbar />
      {renderMobileMenu}
      {renderMenu}
    </>
  );
};

export default Navbar; 