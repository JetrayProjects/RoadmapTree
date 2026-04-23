'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Resource } from '@/lib/types';

interface ResourceNodeData {
  label: string;
  description: string;
  type: 'youtube' | 'pdf' | 'doc' | 'article' | 'link';
  resources: Resource[];
  estimatedTime: number;
  completed?: boolean;
  progressPercent?: number;
  onLabelChange?: (newLabel: string) => void;
}

const resourceTypeIcons: Record<string, string> = {
  youtube: '▶',
  pdf: '📄',
  doc: '📝',
  article: '📰',
  link: '🔗',
};

const resourceTypeLabels: Record<string, string> = {
  youtube: 'YouTube',
  pdf: 'PDF',
  doc: 'Word Doc',
  article: 'Article',
  link: 'Link',
};

export function ResourceNode({ data, selected }: NodeProps<ResourceNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(data.label || '');
  }, [data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== data.label) {
      data.onLabelChange?.(trimmed);
    } else {
      setEditValue(data.label || '');
    }
    setIsEditing(false);
  }, [editValue, data]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditValue(data.label || '');
      setIsEditing(false);
    }
  }, [commitEdit, data.label]);

  return (
    <div
      className={`rounded-xl shadow-lg min-w-[280px] max-w-[340px] transition-colors duration-300 ${
        selected ? 'ring-2 ring-black shadow-xl' : ''
      } ${
        data.completed 
          ? 'bg-green-100 border-2 border-green-400' 
          : 'bg-white border border-gray-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-black !border-white !border-2"
      />
      
      <div className="p-5">
        <div className="mb-3 relative text-center">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="text-base font-bold text-black bg-gray-50 border border-gray-300 rounded-md px-2 py-1 w-full outline-none focus:ring-2 focus:ring-black focus:border-transparent text-center"
            />
          ) : (
            <span
              className="text-base font-bold text-black truncate cursor-text block"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Double-click to rename"
            >
              {data.label || 'Resource Node'}
            </span>
          )}
        </div>
        
        {data.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {data.description}
          </p>
        )}
        
        {data.progressPercent !== undefined && data.resources?.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Progress</span>
              <span className="text-[10px] font-bold text-green-600">{Math.round(data.progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-green-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${data.progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {data.estimatedTime > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-black font-semibold">
                {data.estimatedTime >= 60
                  ? `${Math.floor(data.estimatedTime / 60)}h${data.estimatedTime % 60 > 0 ? ` ${data.estimatedTime % 60}m` : ''}`
                  : `${data.estimatedTime}m`}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-black !border-white !border-2"
      />
    </div>
  );
}

interface MilestoneNodeData {
  label: string;
  description: string;
  completed?: boolean;
}

export function MilestoneNode({ data, selected }: NodeProps<MilestoneNodeData>) {
  return (
    <div
      className={`bg-gradient-to-br from-black to-gray-800 text-white rounded-xl shadow-lg min-w-[220px] ${
        selected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-white !border-white"
      />
      
      <div className="p-6 text-center">
        <div className="mb-3">
          {data.completed ? (
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          )}
        </div>
        <div className="font-bold text-base uppercase tracking-wide text-white">
          {data.label || 'Milestone'}
        </div>
        {data.description && (
          <p className="text-xs text-gray-300 mt-2 opacity-80">
            {data.description}
          </p>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-white !border-white"
      />
    </div>
  );
}

interface TextNodeData {
  label: string;
  description: string;
  onLabelChange?: (newLabel: string) => void;
}

export function TextNode({ data, selected }: NodeProps<TextNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(data.label || '');
  }, [data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== data.label) {
      data.onLabelChange?.(trimmed);
    } else {
      setEditValue(data.label || '');
    }
    setIsEditing(false);
  }, [editValue, data]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditValue(data.label || '');
      setIsEditing(false);
    }
  }, [commitEdit, data.label]);

  return (
    <div
      className={`bg-white rounded-lg border min-w-[200px] max-w-[260px] ${
        selected ? 'border-black border-2 shadow-lg' : 'border-gray-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-gray-400 !border-white"
      />
      
      <div className="p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="font-semibold text-sm text-center text-gray-700 bg-gray-50 border border-gray-300 rounded-md px-1.5 py-0.5 w-full outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          ) : (
            <span
              className="font-semibold text-sm text-gray-700 cursor-text text-center block"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Double-click to rename"
            >
              {data.label || 'Note'}
            </span>
          )}
        </div>
        {data.description && (
          <p className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">
            {data.description}
          </p>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-gray-400 !border-white"
      />
    </div>
  );
}
