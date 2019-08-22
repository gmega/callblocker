// @flow

import Loader from './Loader';
import Typography from '@material-ui/core/Typography';
import {ErrorOutline} from '@material-ui/icons';
import React from "react";
import type {AsyncList} from '../actions/api';
import {renderAsyncList} from '../actions/api';

type AsyncListProps<ElementType, ComponentProps> = {|
  list: AsyncList<ElementType>,
  listRender: (list: Array<ElementType>, props: ComponentProps) => React$Node,
  listRenderProps: ComponentProps,
  emptyMessage: string
|};

export default function AsyncListView<ElementType, ComponentProps>(props: AsyncListProps<ElementType, ComponentProps>) {
  return renderAsyncList(
    props.list,
    () => (
      <Loader variant='bare'/>
    ),
    (list: Array<ElementType>) => {
      if (list.length > 0) {
        return props.listRender(list, props.listRenderProps)
      } else {
        return (
          <div style={{display: 'flex', alignContent: 'center'}}>
            <ErrorOutline htmlColor='#6C6C6C' style={{marginLeft: 5, marginRight: 15}}/>
            <Typography
              variant='body1'
              color='textSecondary'
            >
              {props.emptyMessage}
            </Typography>
          </div>
        )
      }
    }
  );
}

AsyncListView.defaultProps = {
  listRenderProps: {},
  emptyMessage: 'Nothing to display.'
};