import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const GooglePlacesAutocomplete = ({
  value,
  onChange,
  placeholder = "Ingrese la dirección...",
  className,
  disabled = false
}: GooglePlacesAutocompleteProps) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [inputValue, setInputValue] = useState(value);

  // Sync with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize autocomplete with multiple event listeners
  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled || autocompleteRef.current) {
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
      console.error('❌ Google Maps Places Autocomplete not available');
      return;
    }

    try {
      console.log('🗺️ Initializing Google Places Autocomplete with enhanced event handling...');
      
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'uy' },
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
      });

      // Multiple event listeners for better detection
      const handlePlaceChanged = () => {
        console.log('🎯 PLACE_CHANGED EVENT TRIGGERED!');
        
        const place = autocomplete.getPlace();
        console.log('📍 Place object:', place);
        
        if (place && place.formatted_address) {
          const address = place.formatted_address;
          console.log('✅ Setting address to:', address);
          
          // Update everything immediately
          setInputValue(address);
          
          // Force update input element
          if (inputRef.current) {
            inputRef.current.value = address;
            inputRef.current.blur(); // Remove focus to trigger any change events
          }
          
          // Call onChange with delay to ensure everything is updated
          setTimeout(() => {
            onChange(address, place);
            console.log('✅ onChange called with:', address);
          }, 0);
        } else {
          console.log('⚠️ Place has no formatted_address');
        }
      };

      autocomplete.addListener('place_changed', handlePlaceChanged);
      
      // Additional listeners for debugging
      autocomplete.addListener('places_changed', () => {
        console.log('🔄 places_changed event');
      });

      autocompleteRef.current = autocomplete;
      console.log('✅ Autocomplete with enhanced events initialized');

      // Also listen for clicks on pac-items directly
      const handlePacItemClick = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target && (target.classList.contains('pac-item') || target.closest('.pac-item'))) {
          console.log('🖱️ Direct PAC item click detected!');
          
          // Small delay to let Google handle the click first
          setTimeout(() => {
            const place = autocomplete.getPlace();
            console.log('📍 Place from direct click:', place);
            
            if (place && place.formatted_address) {
              handlePlaceChanged();
            }
          }, 100);
        }
      };

      // Listen for clicks on the document to catch pac-item clicks
      document.addEventListener('click', handlePacItemClick, true);
      
      return () => {
        document.removeEventListener('click', handlePacItemClick, true);
      };

    } catch (error) {
      console.error('❌ Error initializing autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        try {
          if (window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
          autocompleteRef.current = null;
          console.log('🧹 Autocomplete cleaned up');
        } catch (error) {
          console.error('❌ Error cleaning up:', error);
        }
      }
    };
  }, [isLoaded, disabled, onChange]);

  // Enhanced CSS with better interaction
  useEffect(() => {
    if (!isLoaded) return;

    const styleId = 'google-places-super-enhanced';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .pac-container {
        z-index: 999999 !important;
        border-radius: 12px !important;
        border: 3px solid #ef4444 !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        background: #ffffff !important;
        font-family: inherit !important;
        margin-top: 8px !important;
        overflow: visible !important;
        min-width: 350px !important;
        position: absolute !important;
      }
      .pac-item {
        padding: 20px 24px !important;
        border-bottom: 2px solid #f3f4f6 !important;
        cursor: pointer !important;
        font-size: 16px !important;
        font-weight: 500 !important;
        line-height: 1.6 !important;
        color: #1f2937 !important;
        background: #ffffff !important;
        transition: all 0.3s ease !important;
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        position: relative !important;
        user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      .pac-item:hover {
        background: #ef4444 !important;
        color: #ffffff !important;
        transform: translateX(4px) !important;
        box-shadow: inset 4px 0 0 #dc2626 !important;
      }
      .pac-item:active {
        background: #dc2626 !important;
        color: #ffffff !important;
        transform: translateX(6px) !important;
      }
      .pac-item:last-child {
        border-bottom: none !important;
        border-radius: 0 0 12px 12px !important;
      }
      .pac-item:first-child {
        border-radius: 12px 12px 0 0 !important;
      }
      .pac-item-selected {
        background: #ef4444 !important;
        color: #ffffff !important;
        transform: translateX(4px) !important;
      }
      .pac-matched {
        font-weight: 700 !important;
        text-decoration: underline !important;
      }
      .pac-icon {
        margin-right: 16px !important;
        width: 24px !important;
        height: 24px !important;
        filter: brightness(0) invert(1) !important;
      }
      .pac-item-query {
        color: inherit !important;
      }
      .pac-item::before {
        content: "📍" !important;
        margin-right: 8px !important;
        font-size: 18px !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle && document.head.contains(existingStyle)) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [isLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('⌨️ Input changed to:', newValue);
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleInputFocus = () => {
    console.log('🎯 Input focused');
  };

  const handleInputClick = () => {
    console.log('🖱️ Input clicked');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log('⏎ Enter pressed - preventing form submission');
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      console.log('⬆️⬇️ Arrow key pressed:', e.key);
    }
  };

  if (loadError) {
    console.error('❌ Google Maps load error:', loadError);
    return (
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
    );
  }

  if (!isLoaded) {
    return (
      <Input
        placeholder="Cargando Google Maps..."
        disabled
        className={className}
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={handleInputChange}
      onFocus={handleInputFocus}
      onClick={handleInputClick}
      onKeyDown={handleInputKeyDown}
      placeholder={placeholder}
      className={cn("w-full", className)}
      disabled={disabled}
      autoComplete="off"
    />
  );
};