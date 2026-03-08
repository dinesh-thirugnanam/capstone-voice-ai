// src/types/serverEvents.ts
export type ServerEvent =
    | MessageStart
    | MessageChunk
    | MessageEnd
    | TableData
    | ErrorEvent;

export interface MessageChunk {
    event: "message.chunk";
    id: string;
    content: string;
}

export interface MessageStart {
    event: "message.start";
    id: string;
}

export interface MessageEnd {
    event: "message.end";
    id: string;
}

export interface TableData {
    event: "table.data";
    id: string;
    rows: string[];
}
