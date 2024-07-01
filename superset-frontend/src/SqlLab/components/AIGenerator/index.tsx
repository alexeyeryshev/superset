/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { FC, useMemo, useState } from 'react';

import { Column, styled, t } from '@superset-ui/core';
import { QueryEditor, SqlLabRootState } from 'src/SqlLab/types';
import Button from 'src/components/Button';
import useQueryEditor from 'src/SqlLab/hooks/useQueryEditor';
import { useAiCompletions } from '../AceEditorWrapper/useAiCompletions';
import { shallowEqual, useDispatch, useSelector, useStore } from 'react-redux';
import { queryEditorSetSql } from 'src/SqlLab/actions/sqlLab';
import { useDebounceValue } from 'src/hooks/useDebounceValue';
import { VALIDATION_DEBOUNCE_MS } from 'src/SqlLab/constants';
import { skipToken } from '@reduxjs/toolkit/query';
import { tableEndpoints } from 'src/hooks/apiResources';
import { api } from 'src/hooks/apiResources/queryApi';
import { fetchAiCompletions } from './fetchAiCompletions';

const StyledToolbar = styled.div`
  padding: ${({ theme }) => theme.gridUnit * 2}px;
  background: ${({ theme }) => theme.colors.grayscale.light5};
  display: flex;
  justify-content: space-between;
  border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
  border-top: 0;
  column-gap: ${({ theme }) => theme.gridUnit}px;

  form {
    margin-block-end: 0;
  }

  .leftItems,
  .rightItems {
    display: flex;
    align-items: center;
    & > span {
      margin-right: ${({ theme }) => theme.gridUnit * 2}px;
      display: inline-block;

      &:last-child {
        margin-right: 0;
      }
    }
  }

  .limitDropdown {
    white-space: nowrap;
  }
`;

export type Props = {
  queryEditorId: QueryEditor['id'];
};

const AiGenerator: FC<Props> = ({ queryEditorId }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const queryEditor = useQueryEditor(queryEditorId, [
    'id',
    'dbId',
    'sql',
    'catalog',
    'schema',
    'templateParams',
    'cursorPosition',
  ]);

  const tablesForColumnMetadata = useSelector<SqlLabRootState, string[]>(
    ({ sqlLab }) =>
      (sqlLab?.tables ?? [])
        .filter(table => table.queryEditorId === queryEditorId)
        .map(table => table.name),
  );

  const store = useStore();
  const apiState = store.getState()[api.reducerPath];
  const allColumns = useMemo(() => {
    const columns = new Set<Column>();
    tablesForColumnMetadata.forEach(table => {
      tableEndpoints.tableMetadata
        .select(
          queryEditor.dbId && queryEditor.schema
            ? {
                dbId: queryEditor.dbId,
                catalog: queryEditor.catalog,
                schema: queryEditor.schema,
                table,
              }
            : skipToken,
        )({
          [api.reducerPath]: apiState,
        })
        .data?.columns?.forEach((column: Column) => {
          columns.add(column);
        });
    });
    return [...columns];
  }, [
    tablesForColumnMetadata,
    queryEditor.dbId,
    queryEditor.schema,
    queryEditor.catalog,
    apiState,
  ]);

  const schemaText = allColumns
    .map(column => `${column.name}:${column.type}`)
    .join('\n');

  return (
    <StyledToolbar className="sql-ai-toolbar" id="js-sql-ai-toolbar">
      <input
        type="text"
        onChange={e => setPrompt(e.target.value)}
        value={prompt}
        className="form-control input-sm"
        placeholder={t('Generate AI')}
      />
      <Button
        onClick={async () => {
          setLoading(true);
          const completion = await fetchAiCompletions({
            schemaText,
            prompt,
            tablesForColumnMetadata,
          });
          dispatch(queryEditorSetSql(queryEditor, completion));
          setLoading(false);
        }}
        loading={loading}
      >
        Generate
      </Button>
    </StyledToolbar>
  );
};

export default AiGenerator;
