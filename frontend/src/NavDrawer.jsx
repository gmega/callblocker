import React from 'react'
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
import CallerPanel from "./CallerPanel";
import {map, removeKey, weakId} from './helpers';
import {BrowserRouter, Link, Redirect, Route} from "react-router-dom";

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


export function ErrorArea(props) {
    if (Object.entries(props.errors).length) {
        return (
            <div style={{backgroundColor: '#ff7272', color: 'white', padding: '1em'}}>
                {Object.entries(props.errors).map(([key, value]) => <div key={key}>{value}</div>)}
            </div>
        )
    } else {
        return <div></div>;
    }
}

export default function NavDrawer(props) {
    const {container} = props;
    const classes = useStyles();
    const theme = useTheme();

    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [message, setMessage] = React.useState(null);

    function handleDrawerToggle() {
        setMobileOpen(!mobileOpen);
    }

    function reportError(error_message, error_key = null) {
        let id = error_key ? error_key : weakId();

        // Has this error been reported already?
        let oldError = errors[error_key];
        if (oldError) {
            // It has. Cancel timers on it or the error will be
            // removed prematurely.
            clearTimeout(oldError.timer);
        }

        // Sets the error (for the first time, or again)
        // with a fresh timer.
        setErrors({
            ...errors,
            [id]: {
                message: error_message,
                timer: setTimeout(removeError(id), 2000)
            }
        });
    }

    function reportUpdate(patches) {
        setMessage(`${patches.length} item${patches.length > 1 ? 's' : ''} updated successfully.`)
        setTimeout(() => setMessage(null), 3000);
    }

    function removeError(id) {
        return () => setErrors(removeKey(errors, id));
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
            <BrowserRouter>
                {/* We put this route here to avoid having to leak the default path into
                    the webserver config. */}
                <Route exact path="/" render={() => (<Redirect to="/callers"/>)}/>
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
                        <Route path="/callers" render={() => (
                            <Typography variant="h6" noWrap>
                                Recent Callers
                            </Typography>
                        )}/>
                        <Route path="/Phonebook" render={() => (
                            <Typography variant="h6" noWrap>
                                Phonebook
                            </Typography>
                        )}/>
                        <Route path="/Settings" render={() => (
                            <Typography variant="h6" noWrap>
                                Settings
                            </Typography>
                        )}/>

                    </Toolbar>
                    <ErrorArea errors={map(errors, (key, value) => value.message)}/>
                </AppBar>
                <nav className={classes.drawer} aria-label="Mailbox folders">
                    {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
                    <Hidden smUp implementation="css">
                        <Drawer
                            container={container}
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
                    <Route path="/callers" render={() => {
                        return <CallerPanel onError={reportError} onUpdate={reportUpdate}/>
                    }}/>
                    <Snackbar
                        open={message != null}
                        message={message}
                    />
                </main>
            </BrowserRouter>
        </div>
    );
}


