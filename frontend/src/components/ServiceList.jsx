// @flow
import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import type {AsyncList} from '../actions/api';
import {fetchServices, modifyService} from '../actions/api';
import {ServiceState} from '../types/domainTypes';
import type {Service, ServiceStateType} from '../types/domainTypes';
import {API_PARAMETERS} from './APIConfig';
import AsyncListView from './AsyncList';
import ServiceListItem from './ServiceListItem';

type ServiceListProps = {
  dispatch: Dispatch,
  services: AsyncList<Service>
}

function ServiceList(props: ServiceListProps) {

  const {dispatch, services} = props;

  useEffect(() => {
    const intervalId = setInterval(
      () => dispatch(fetchServices()), API_PARAMETERS.pollingInterval
    );
    return () => clearInterval(intervalId);
  }, []);

  function doModifyService(service: Service, state: ServiceStateType) {
    dispatch(modifyService({
      original: service,
      status: {state: state}
    }));
  }

  return (
    <AsyncListView
      list={services}
      emptyMessage='No services to display.'
      listRender={
        (services: Array<Service>) =>
          services.map((service: Service) =>
            <ServiceListItem
              key={service.id}
              service={service}
              onStart={(service: Service) => doModifyService(service, ServiceState.READY)}
              onStop={(service: Service) => doModifyService(service, ServiceState.TERMINATED)}
            />
          )
      }
      listRenderProps={{}}
    />
  )
}

export default connect((state) => state)(ServiceList);