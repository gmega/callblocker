// @flow

import {
  AppBar,
  CssBaseline,
  Divider,
  Drawer,
  Hidden,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Toolbar,
  Typography
} from "@material-ui/core";

import {makeStyles, useTheme} from '@material-ui/core/styles'
import {ContactPhone, Phone, Settings} from "@material-ui/icons";
import MenuIcon from '@material-ui/icons/Menu';
import React from 'react'
import {connect} from 'react-redux';
import {Link} from "react-router-dom";
import Routes from '../Routes';
import type {CallerDelta} from '../types/domainTypes';
import {ErrorArea} from './ErrorArea';
import type {StateType} from '../reducers/index';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    marginLeft: drawerWidth,
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  link: {
    color: 'inherit',
    textDecoration: 'inherit'
  }
}));


function NavDrawer(props: StateType) {
  const classes = useStyles();
  const theme = useTheme();
  
  const [mobileOpen, setMobileOpen] = React.useState(false);
  (mobileOpen: boolean);

  const [message, setMessage] = React.useState(null);
  (message: ?string);

  const [title, setTitle] = React.useState('No Title');
  (title: string);

  function handleDrawerToggle() {
    setMobileOpen(!mobileOpen);
  }

  function reportUpdate(patches: Array<CallerDelta>) {
    setMessage(`${patches.length} item${patches.length > 1 ? 's' : ''} updated successfully.`);
    setTimeout(() => setMessage(null), 3000);
  }

  function handleRouteActivation(routeId: string) {
    setTitle(routeId);
  }

  const drawer = (
    <div>
      <div className={classes.toolbar}/>
      <Divider/>
      <List>
        <Link to='/callers' className={classes.link}>
          <ListItem button key='Recent Callers'>
            <ListItemIcon><Phone/></ListItemIcon>
            <ListItemText primary='Recent Callers'/>
          </ListItem>
        </Link>
        <Link to='/phonebook' className={classes.link}>
          <ListItem button key='Phonebook'>
            <ListItemIcon><ContactPhone/></ListItemIcon>
            <ListItemText primary='Phonebook'/>
          </ListItem>
        </Link>
      </List>
      <Divider/>
      <List>
        <Link to='/settings' className={classes.link}>
          <ListItem button key='Settings'>
            <ListItemIcon><Settings/></ListItemIcon>
            <ListItemText primary='Settings'/>
          </ListItem>
        </Link>
      </List>
    </div>
  );
  
  return (
    <div className={classes.root}>
      <CssBaseline/>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="Open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon/>
          </IconButton>
          <Typography variant="h6" noWrap>{title}</Typography>
        </Toolbar>
        <ErrorArea errors={new Map(
          [...props.operationStatus.entries()]
            .filter(([key, value]) => !value.success)
            .map(([key, value]) => [key, value.message])
        )}/>
      </AppBar>
      <nav className={classes.drawer} aria-label="Mailbox folders">
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Hidden smUp implementation="css">
          <Drawer
            //container={container}
            variant="temporary"
            anchor={theme.direction === 'rtl' ? 'right' : 'left'}
            open={mobileOpen}
            onClose={handleDrawerToggle}
            classes={{
              paper: classes.drawerPaper,
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}>
            {drawer}
          </Drawer>
        </Hidden>
        <Hidden xsDown implementation="css">
          <Drawer
            classes={{
              paper: classes.drawerPaper,
            }}
            variant="permanent"
            open>
            {drawer}
          </Drawer>
        </Hidden>
      </nav>
      <main className={classes.content}>
        <div className={classes.toolbar}/>
        <Routes
          onRouteActivation={handleRouteActivation}
          onCallerUpdate={reportUpdate}
          onError={() => undefined}/>
        <Snackbar
          open={message != null}
          message={message}
        />
      </main>
    </div>
  );
}

const mapStateToProps = (state: StateType, ownProps?) => ({...state, ...ownProps});

export default connect(mapStateToProps)(NavDrawer);