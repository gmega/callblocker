import {Box, Divider, makeStyles, Tab, Tabs, Typography} from '@material-ui/core';
import React from 'react';
import Nop from './Nop';
import ServiceList from './ServiceList';

const useStyles = makeStyles(theme => ({
  settingsTitle: {
    padding: theme.spacing(1)
  }
}));

function TabPanel(props) {
  const {children, value, index, ...other} = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      <Box p={3}>{children}</Box>
    </Typography>
  );
}

export default () => {
  const classes = useStyles();

  const [active, setActive] = React.useState(0);

  function handleChange(event, activeTab) {
    setActive(activeTab);
  }

  // Stub, just returns service list for now.
  return (
    <Nop>
      <Tabs value={active} onChange={handleChange}>
        <Tab label="System"/>
        <Tab label="Modem"/>
      </Tabs>
      <TabPanel value={active} index={0}>
        <div>
          <Typography
            variant='h6'
            color='textSecondary'
            className={classes.settingsTitle}
          >Services</Typography>
          <ServiceList/>
        </div>
      </TabPanel>
    </Nop>
  )
}