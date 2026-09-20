import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X, Check, Loader2, Plus } from 'lucide-react';

/**
 * Universal Searchable Select / Combobox Component
 * Supports:
 * - Local search / filtering
 * - Debounced Async / Server-side search
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Creatable / manual text entry
 * - Custom badges and sublabels
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  onSearch, // async (query) => Promise<Array>
  placeholder = 'Select option...',
  searchPlaceholder = 'Type to search...',
  creatable = false,
  onCreate,
  clearable = true,
  disabled = false,
  error = false,
  loading: externalLoading = false,
  emptyMessage = 'No options found',
  className = '',
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [asyncOptions, setAsyncOptions] = useState([]);
  const [isAsyncLoading, setIsAsyncLoading] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options into consistent object structure: { value, label, subLabel, badge }
  const normalizedOptions = useMemo(() => {
    const raw = onSearch ? asyncOptions : options;
    return raw.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value !== undefined ? opt.value : opt.id,
          label: opt.label || opt.name || String(opt.value),
          subLabel: opt.subLabel || opt.code || opt.mobile || '',
          badge: opt.badge || null,
          raw: opt
        };
      }
      return {
        value: opt,
        label: String(opt),
        subLabel: '',
        badge: null,
        raw: opt
      };
    });
  }, [options, asyncOptions, onSearch]);

  // Current selected option object
  const selectedOption = useMemo(() => {
    if (value === '' || value === null || value === undefined) return null;
    const found = normalizedOptions.find((opt) => String(opt.value) === String(value));
    if (found) return found;
    // If creatable and value doesn't match an option, create a virtual option
    if (creatable && value) {
      return { value, label: String(value), subLabel: '', badge: null };
    }
    return null;
  }, [value, normalizedOptions, creatable]);

  // Filtered options (for local search)
  const filteredOptions = useMemo(() => {
    if (onSearch) {
      return normalizedOptions;
    }
    if (!searchQuery.trim()) {
      return normalizedOptions;
    }
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false;
      const matchVal = String(opt.value).toLowerCase().includes(q);
      return matchLabel || matchSub || matchVal;
    });
  }, [normalizedOptions, searchQuery, onSearch]);

  // Debounced async search effect
  useEffect(() => {
    if (!onSearch || !isOpen) return;

    const timer = setTimeout(async () => {
      setIsAsyncLoading(true);
      try {
        const results = await onSearch(searchQuery);
        setAsyncOptions(results || []);
        setHighlightedIndex(0);
      } catch (err) {
        console.error('Combobox async search error:', err);
      } finally {
        setIsAsyncLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, onSearch]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    if (onChange) {
      onChange(option.value, option);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateCustom = () => {
    if (!searchQuery.trim()) return;
    const trimmed = searchQuery.trim();
    if (onCreate) {
      onCreate(trimmed);
    } else if (onChange) {
      onChange(trimmed, { value: trimmed, label: trimmed });
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange('', null);
    }
    setSearchQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalItems = filteredOptions.length + (creatable && searchQuery.trim() ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex < filteredOptions.length) {
          const opt = filteredOptions[highlightedIndex];
          if (opt) handleSelect(opt);
        } else if (creatable && searchQuery.trim()) {
          handleCreateCustom();
        }
        break;
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const isLoading = externalLoading || isAsyncLoading;
  const showCreateOption = creatable && searchQuery.trim() && !filteredOptions.some(
    (opt) => opt.label.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  return (
    <div
      className={`combobox-container ${disabled ? 'disabled' : ''} ${error ? 'error' : ''} ${className}`}
      style={style}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <div
        className={`combobox-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
      >
        <div className="combobox-trigger-content">
          {selectedOption ? (
            <div className="combobox-selected-label">
              <span className="combobox-main-text">{selectedOption.label}</span>
              {selectedOption.subLabel && (
                <span className="combobox-sub-text">{selectedOption.subLabel}</span>
              )}
              {selectedOption.badge && (
                <span className="combobox-badge">{selectedOption.badge}</span>
              )}
            </div>
          ) : (
            <span className="combobox-placeholder">{placeholder}</span>
          )}
        </div>

        <div className="combobox-actions">
          {clearable && selectedOption && !disabled && (
            <button
              type="button"
              className="combobox-clear-btn"
              onClick={handleClear}
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`combobox-chevron ${isOpen ? 'rotated' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="combobox-dropdown">
          {/* Search Box */}
          <div className="combobox-search-box">
            <Search size={14} className="combobox-search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="combobox-search-input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {isLoading && <Loader2 size={14} className="combobox-spinner" />}
          </div>

          {/* Options List */}
          <div className="combobox-list" ref={listRef}>
            {isLoading && filteredOptions.length === 0 ? (
              <div className="combobox-empty">
                <Loader2 size={16} className="combobox-spinner" style={{ margin: '0 auto 6px' }} />
                <span>Searching records...</span>
              </div>
            ) : filteredOptions.length === 0 && !showCreateOption ? (
              <div className="combobox-empty">{emptyMessage}</div>
            ) : (
              <>
                {filteredOptions.map((opt, idx) => {
                  const isSelected = selectedOption && String(selectedOption.value) === String(opt.value);
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={String(opt.value) + idx}
                      className={`combobox-item ${isHighlighted ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                      <div className="combobox-item-info">
                        <span className="combobox-item-title">{opt.label}</span>
                        {opt.subLabel && (
                          <span className="combobox-item-subtitle">{opt.subLabel}</span>
                        )}
                      </div>
                      <div className="combobox-item-meta">
                        {opt.badge && <span className="combobox-badge">{opt.badge}</span>}
                        {isSelected && <Check size={15} className="combobox-check-icon" />}
                      </div>
                    </div>
                  );
                })}

                {/* Creatable option if custom entry is allowed */}
                {showCreateOption && (
                  <div
                    className={`combobox-item creatable ${highlightedIndex === filteredOptions.length ? 'highlighted' : ''}`}
                    onClick={handleCreateCustom}
                    onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                  >
                    <div className="combobox-item-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Plus size={14} style={{ color: 'var(--primary)' }} />
                      <span>
                        Use / Add "<strong>{searchQuery.trim()}</strong>"
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
