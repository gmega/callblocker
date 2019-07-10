import React from 'react';
import {
    Grid, Button, Typography, List, ListItem,
    ListItemAvatar, Avatar, ListItemText, Paper, Snackbar,
    makeStyles
} from "@material-ui/core";
import {Phone, Block} from '@material-ui/icons';
import Checkbox from "@material-ui/core/Checkbox";
import {API_ENDPOINT, API_POLLING_INTERVAL} from "./index";
import SimpleListMenu from "./SimpleListMenu";

import moment from 'moment';

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        maxWidth: 752,
    },
    demo: {
        backgroundColor: theme.palette.background.paper,
    },
    title: {
        margin: theme.spacing(4, 0, 2),
    },
    button: {
        margin: theme.spacing(1)
    }
}));

const options = [
    {label: 'Most recent callers', api_parameter: 'last_call'},
    {label: 'Callers with most calls', api_parameter: 'calls'},
    {label: 'Callers added most recently', api_parameter: 'date_inserted'}
];

function formatTime(date) {
    let now = new Date();
    let callDate = new Date(date);

    // Call happened this year.
    if (
        now.getFullYear() === callDate.getFullYear()
    ) {
        // Call happened this month.
        if (now.getMonth() === callDate.getMonth()) {
            // Call happened today.
            if (now.getDay() === callDate.getDay()) {
                return moment(callDate).format('h:mm a');
            }
            return moment(callDate).format('MMMM Do')
        }
        return moment(callDate).format('MMMM Do YYYY')
    }
}

class CallerList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            callers: [],
            errors: {
                hasErrors: false,
                reason: null
            },
            selected: new Set(),
            ordering: 0
        };
    }

    componentDidMount() {
        this.timer = setInterval(() => this.fetchItems(), API_POLLING_INTERVAL);
    }

    componentWillMount() {
        clearInterval(this.timer);
        this.timer = null;
    }

    fetchItems = () => {
        let self = this;
        fetch(`${API_ENDPOINT}api/callers/?ordering=${options[this.state.ordering].api_parameter}`)
            .then(response => {
                if (!response.ok) {
                    this.setErrorStatus(response, `Failed to fetch resource from backend: ${response}.`,
                        4000)
                }
                return response.json();
            })
            .then(callers => {
                let state = this.state;
                state.callers = this.processCallers(callers);
                this.setState(state);
            }).catch(function (reason) {
            self.setErrorStatus(reason, `Error contacting the backend server. Retrying...`, 1500);
        });
    };

    setErrorStatus = (response, message, timeout = 1000) => {
        console.log(response);
        let state = this.state;
        state.errors.autoHide = timeout;
        state.errors.hasErrors = true;
        state.errors.message = message;
        this.setState(state);
    };

    clearErrorStatus = () => {
        let state = this.state;
        state.errors.hasErrors = false;
        state.errors.message = null;
        this.setState(state);
    };

    processCallers(callers) {
        return callers.map(caller => {
            caller.last_call = formatTime(caller.last_call);
            return caller;
        })
    }

    applyBlock = (block) => {
        let request = Array.from(this.state.selected).map(id => {
            let element = this.callerById(this.state, id);
            return {
                full_number: element.full_number,
                block: block
            }
        });

        console.log(request);

        let self = this;
        fetch(`${API_ENDPOINT}api/callers/`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'PATCH',
            body: JSON.stringify(request)
        }).then(response => {
            if (!response.ok) {
                this.setErrorStatus(response,
                    `Update failed: ${response.status} ${response.statusText}.`,
                    3000);
            } else {
                this.setErrorStatus(null,
                    `${request.length} items updated successfully.`, 3000)
            }
        }).catch((reason) => {
            self.setErrorStatus(`Update failed: ${reason}.`)
        });

    };

    onSelect = (source, toggle) => {
        let state = this.state;
        let element = this.callerById(state, source.target.name);
        if (!element) {
            throw new Error('Lost sync between list and state.');
        }

        if (toggle) {
            state.selected.add(element.full_number);
        } else {
            state.selected.delete(element.full_number);
        }

        this.setState(state);
    };

    orderingChanged = (source, index) => {
        let state = this.state;
        state.ordering = index;
        this.setState(state);
    };

    blockedCallerCount = (block_status) => {
        return this.state.callers.filter(element => (
            (element.block === block_status) &&
            (this.state.selected.has(element.full_number))

        )).length
    };

    callerById = (state, callerId) => {
        return state.callers.find(caller => caller.full_number === callerId);
    };

    render() {
        return (
            <Grid container spacing={2} style={{maxWidth: '50vw', minWidth: '380px'}}>
                <Grid container xs={6} alignItems="center" justifyContent="center">
                    <Typography variant="h6" style={{padding: "8px"}}>
                        Recent Callers
                    </Typography>
                </Grid>
                <Grid item xs={6}>
                    <SimpleListMenu
                        options={options.map(entry => entry.label)}
                        initial={0}
                        onChange={this.orderingChanged}
                    />
                </Grid>
                <Grid item xs={12}>
                    <div>
                        <Paper elevation="0">
                            <List style={{maxHeight: 'calc(100vh - 250px)', overflow: "auto"}}
                                  dense={false}>{this.state.callers.map(phone =>
                                <ListItem key={phone.full_number}>
                                    <Checkbox
                                        edge="start"
                                        tabIndex={-1}
                                        disableRipple
                                        onChange={this.onSelect}
                                        name={phone.full_number}
                                    />
                                    <ListItemAvatar>
                                        <Avatar>
                                            {phone.block ? <Block/> : <Phone/>}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={`(${phone.area_code}) ${phone.number}`}
                                        secondary={
                                            `${phone.description ? phone.description : 'Unknown Caller'} - ${phone.calls} calls`
                                        }
                                    />
                                    <Typography variant="caption" color="textSecondary">
                                        {phone.last_call}
                                    </Typography>

                                </ListItem>,
                            )}
                            </List>
                        </Paper>
                        <Snackbar
                            open={this.state.errors.hasErrors}
                            anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                            message={this.state.errors.message}
                            autoHideDuration={this.state.errors.autoHide}
                            onClose={this.clearErrorStatus}
                        />
                        <div className={useStyles.demo}>
                            <Button variant="contained" color="primary" disabled={
                                this.blockedCallerCount(true) === 0}
                                    onClick={() => this.applyBlock(false)}>
                                {this.state.selected.size > 1 ? "Allow All" : "Allow"}
                            </Button>
                            <Button variant="contained" color="secondary" disabled={
                                this.blockedCallerCount(false) === 0
                            }
                                    style={{margin: 20}} onClick={() => this.applyBlock(true)}>
                                {this.state.selected.size > 1 ? "Block All" : "Block"}
                            </Button>
                        </div>
                    </div>
                </Grid>
            </Grid>
        )
    }
}

export default CallerList;