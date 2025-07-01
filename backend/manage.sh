#!/bin/bash

# Management script for Background Remover API

SERVICE_NAME="bg-remover"

case "$1" in
    start)
        echo "Starting Background Remover API..."
        sudo systemctl start $SERVICE_NAME
        sudo systemctl status $SERVICE_NAME
        ;;
    stop)
        echo "Stopping Background Remover API..."
        sudo systemctl stop $SERVICE_NAME
        ;;
    restart)
        echo "Restarting Background Remover API..."
        sudo systemctl restart $SERVICE_NAME
        sudo systemctl status $SERVICE_NAME
        ;;
    status)
        echo "Status of Background Remover API:"
        sudo systemctl status $SERVICE_NAME
        ;;
    logs)
        echo "Recent logs:"
        sudo journalctl -u $SERVICE_NAME -f --no-pager
        ;;
    enable)
        echo "Enabling Background Remover API to start on boot..."
        sudo systemctl enable $SERVICE_NAME
        ;;
    disable)
        echo "Disabling Background Remover API from starting on boot..."
        sudo systemctl disable $SERVICE_NAME
        ;;
    health)
        echo "Health check:"
        curl -s http://localhost:5000/health | python3 -m json.tool
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|enable|disable|health}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the service"
        echo "  stop    - Stop the service"
        echo "  restart - Restart the service"
        echo "  status  - Show service status"
        echo "  logs    - Show live logs"
        echo "  enable  - Enable service to start on boot"
        echo "  disable - Disable service from starting on boot"
        echo "  health  - Check API health endpoint"
        exit 1
        ;;
esac 