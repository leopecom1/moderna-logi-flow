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
  const lastValueRef = useRef(value);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external value
  useEffect(() => {
    setInputValue(value);
    lastValueRef.current = value;
  }, [value]);

  // Polling function to detect changes
  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      if (inputRef.current && autocompleteRef.current) {
        const currentValue = inputRef.current.value;
        
        // Check if the value changed and is different from what we're tracking
        if (currentValue !== lastValueRef.current && currentValue !== inputValue) {
          console.log('🔄 POLLING DETECTED CHANGE:', {
            currentValue,
            lastValue: lastValueRef.current,
            inputValue
          });
          
          // Try to get place details
          const place = autocompleteRef.current.getPlace();
          console.log('📍 Place from polling:', place);
          
          if (place && place.formatted_address) {
            console.log('✅ FORCED UPDATE with place details');
            setInputValue(place.formatted_address);
            lastValueRef.current = place.formatted_address;
            onChange(place.formatted_address, place);
          } else if (currentValue && currentValue.length > 5) {
            console.log('✅ FORCED UPDATE without place details');
            setInputValue(currentValue);
            lastValueRef.current = currentValue;
            onChange(currentValue, null);
          }
        }
      }
    }, 100); // Check every 100ms
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled || autocompleteRef.current) {
      return;
    }

    if (!window.google?.maps?.places?.Autocomplete) {
      console.error('❌ Google Maps Places Autocomplete not available');
      return;
    }

    try {
      console.log('🗺️ Initializing Google Places Autocomplete with FORCED detection...');
      
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'uy' },
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
      });

      // Original place_changed event
      autocomplete.addListener('place_changed', () => {
        console.log('🎯 ORIGINAL place_changed event!');
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          console.log('✅ Original event success:', place.formatted_address);
          setInputValue(place.formatted_address);
          lastValueRef.current = place.formatted_address;
          onChange(place.formatted_address, place);
        }
      });

      autocompleteRef.current = autocomplete;

      // Start polling when autocomplete is ready
      startPolling();

      console.log('✅ Enhanced autocomplete initialized with polling');
    } catch (error) {
      console.error('❌ Error initializing autocomplete:', error);
    }

    return () => {
      stopPolling();
      if (autocompleteRef.current) {
        try {
          if (window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
          autocompleteRef.current = null;
        } catch (error) {
          console.error('❌ Error cleaning up:', error);
        }
      }
    };
  }, [isLoaded, disabled, onChange]);

  // Enhanced CSS with click area improvements
  useEffect(() => {
    if (!isLoaded) return;

    const styleId = 'google-places-ultra-enhanced';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .pac-container {
        z-index: 999999 !important;
        border-radius: 12px !important;
        border: 4px solid #dc2626 !important;
        box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.5) !important;
        background: #ffffff !important;
        font-family: inherit !important;
        margin-top: 8px !important;
        overflow: visible !important;
        min-width: 400px !important;
        position: absolute !important;
        animation: pulseRed 1s infinite !important;
      }
      
      @keyframes pulseRed {
        0%, 100% { box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.5); }
        50% { box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.8); }
      }
      
      .pac-item {
        padding: 24px 32px !important;
        border-bottom: 2px solid #fca5a5 !important;
        cursor: pointer !important;
        font-size: 18px !important;
        font-weight: 600 !important;
        line-height: 1.8 !important;
        color: #1f2937 !important;
        background: #ffffff !important;
        transition: all 0.2s ease !important;
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        position: relative !important;
        user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
        min-height: 60px !important;
      }
      
      .pac-item:hover {
        background: #dc2626 !important;
        color: #ffffff !important;
        transform: translateX(8px) scale(1.02) !important;
        box-shadow: inset 6px 0 0 #b91c1c !important;
      }
      
      .pac-item:active {
        background: #b91c1c !important;
        color: #ffffff !important;
        transform: translateX(10px) scale(1.05) !important;
      }
      
      .pac-item:last-child {
        border-bottom: none !important;
        border-radius: 0 0 12px 12px !important;
      }
      
      .pac-item:first-child {
        border-radius: 12px 12px 0 0 !important;
      }
      
      .pac-item-selected {
        background: #dc2626 !important;
        color: #ffffff !important;
        transform: translateX(8px) scale(1.02) !important;
      }
      
      .pac-matched {
        font-weight: 800 !important;
        text-decoration: underline !important;
        text-shadow: 0 0 4px rgba(0,0,0,0.3) !important;
      }
      
      .pac-icon {
        margin-right: 20px !important;
        width: 28px !important;
        height: 28px !important;
        filter: brightness(0) invert(1) !important;
      }
      
      .pac-item-query {
        color: inherit !important;
        font-weight: 700 !important;
      }
      
      .pac-item::before {
        content: "📍 CLICK AQUÍ:" !important;
        margin-right: 12px !important;
        font-size: 16px !important;
        font-weight: 700 !important;
        color: #dc2626 !important;
      }
      
      .pac-item:hover::before {
        color: #ffffff !important;
        animation: bounce 0.5s infinite !important;
      }
      
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
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
    lastValueRef.current = newValue;
    onChange(newValue);
  };

  const handleInputFocus = () => {
    console.log('🎯 Input focused - starting enhanced polling');
    startPolling();
  };

  const handleInputBlur = () => {
    console.log('😴 Input blurred - stopping polling after delay');
    setTimeout(() => {
      stopPolling();
    }, 1000); // Wait 1 second before stopping to catch any late clicks
  };

  const handleInputClick = () => {
    console.log('🖱️ Input clicked');
    startPolling();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

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
      onBlur={handleInputBlur}
      onClick={handleInputClick}
      placeholder={placeholder}
      className={cn("w-full", className)}
      disabled={disabled}
      autoComplete="off"
    />
  );
};