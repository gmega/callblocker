import React, {Component} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import PropTypes from 'prop-types';

const useStyles = makeStyles(theme => ({
    root: {
        maxWidth: 360
    },
}));

export default class SimpleListMenu extends Component {

    constructor(props) {
        super(props);
        this.classes = useStyles;
        this.options = props.options;
        this.onChange = props.onChange;
        this.state = {
            anchorEl: null,
            selectedIndex: 0
        };
    }

    handleClickListItem = (event) => {
        let state = this.state;
        state.anchorEl = event.currentTarget;
        this.setState(state)
    };

    handleMenuItemClick = (event, index) => {
        let state = this.state;
        state.selectedIndex = index;
        state.anchorEl = null;
        this.setState(state);

        // Callback
        this.onChange(this, index);
    };

    handleClose = () => {
        let state = this.state;
        state.anchorEl = null;
        this.setState(state);
    };

    render() {
        return (
            <div className={this.classes.root}>
                <List component="nav" aria-label="Ordering">
                    <ListItem
                        button
                        aria-haspopup="true"
                        aria-controls="lock-menu"
                        aria-label="Show first"
                        onClick={this.handleClickListItem}
                        style={{padding: 0}}
                    >
                        <ListItemText primary="Show first" secondary={this.options[this.state.selectedIndex]}/>
                    </ListItem>
                </List>
                <Menu
                    id="lock-menu"
                    anchorEl={this.state.anchorEl}
                    keepMounted
                    open={Boolean(this.state.anchorEl)}
                    onClose={this.state.handleClose}
                >
                    {this.options.map((option, index) => (
                        <MenuItem
                            key={option}
                            selected={index === this.state.selectedIndex}
                            onClick={event => this.handleMenuItemClick(event, index)}
                        >
                            {option}
                        </MenuItem>
                    ))}
                </Menu>
            </div>
        );
    };
}

SimpleListMenu.propTypes = {
    options: PropTypes.array.isRequired,
    initial: PropTypes.number
};

SimpleListMenu.defaultProps = {
    initial: 0,
    onChange: () => null
};