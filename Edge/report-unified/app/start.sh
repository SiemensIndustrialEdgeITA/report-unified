#!/bin/sh


# CREATE HISTORY PIPE FOR DATA RECEIVING
fifo=/tmp/siemens/automation/HmiHistory
if [ ! -e $fifo ]; then
  echo "Creating Pipe for Report data exchange..."
  mkfifo $fifo
  chmod 777 $fifo
fi

sleep 5

# LOAD EXAMPLES TEMPLATES AND CONFIGURATION IF ENABLED
if [ "$LOAD_EXAMPLE" = "true" ]; then

    echo "Copying examples templates and config files..."

    templateA='/cfg-data/Template_Production.xlsx'
    local_templateA='/app/example/Template_Production.xlsx'
    if [ -f "$templateA" ]; then
        echo "$templateA exists."
    else 
        echo "$templateA does not exist."
        mv $local_templateA $templateA
    fi

    templateB='/cfg-data/Template_Tanks.xlsx'
    local_templateB='/app/example/Template_Tanks.xlsx'
    if [ -f "$templateB" ]; then
        echo "$templateB exists."
    else 
        echo "$templateB does not exist."
        mv $local_templateB $templateB
    fi

    config='/cfg-data/config.json'
    local_config='/app/example/config.json'
    if [ -f "$config" ]; then
        echo "$config exists."
    else 
        echo "$config does not exist."
        mv $local_config $config
    fi

fi

# START NODE APP
echo "Starting Node.JS App..."
node --max-old-space-size=767 report.js


# TO START AS DEBUG COMMENT "START" ABOVE AND UNCOMMENT BELOW
#tail -f /dev/null