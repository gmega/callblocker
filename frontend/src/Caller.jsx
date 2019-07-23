// @flow


export type Caller = {|
  areaCode: string,
  number: string,
  fullNumber: string,
  block: boolean,
  lastCall: string,
  description: string,
  notes: string,
  calls: number;
|};

export type CallerDelta = {|
  original: Caller,
  block?: boolean;
  lastCall?: string;
  description?: string;
  notes?: string;
  calls?: number;
|};

export type Call = {
  caller: Caller,
  blocked: boolean,
  time: string
}