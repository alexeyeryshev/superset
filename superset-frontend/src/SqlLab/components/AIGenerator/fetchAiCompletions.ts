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

import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY, // This is the default and can be omitted
  dangerouslyAllowBrowser: true,
});

export async function fetchAiCompletions(params: any) {
  const { schemaText, prompt, tablesForColumnMetadata } = params;
  const userMessage = {
    role: 'user',
    content: `Generate a SQL query as a completion to the previous message. Output only SQL or comments, do not output anything else, do not format markdown. Below you find user prompt and schema.
            User prompt: ${prompt}
            Table: ${tablesForColumnMetadata[0]}
            Schema: ${schemaText}
        `,
  };
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `you're perfect data scientist and SQL expert.`,
      },
      userMessage,
    ],
    model: 'gpt-3.5-turbo',
  });
  return chatCompletion.choices[0].message.content;
}
