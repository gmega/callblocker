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

    classes = useStyles;

    state = {
        anchorEl: null,
        selectedIndex: 0
    };

    handleMenuClick = (event) => {
        this.setState({
            ...this.state,
            anchorEl: event.currentTarget
        })
    };

    handleMenuItemClick = (event, index) => {
        this.setState({
            selectedIndex: index,
            anchorEl: null
        });

        this.props.onChange(index);
    };

    handleClose = () => {
        this.setState({
            ...this.state,
            anchorEl: null
        })
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
                        onClick={this.handleMenuClick}
                        style={{padding: 0}}
                    >
                        <ListItemText primary="Show first" secondary={this.props.options[this.state.selectedIndex]}/>
                    </ListItem>
                </List>
                <Menu
                    id="lock-menu"
                    anchorEl={this.state.anchorEl}
                    keepMounted
                    open={Boolean(this.state.anchorEl)}
                    onClose={this.props.handleClose}>{
                    this.props.options.map((option, index) => (
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