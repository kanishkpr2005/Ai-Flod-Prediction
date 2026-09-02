import threading
import time

try:
    from .weather_monitor import run_monitoring_cycle
except ImportError:
    from weather_monitor import run_monitoring_cycle


# --------------------------------------------------
# Monitoring configuration
# --------------------------------------------------

MONITOR_INTERVAL_SECONDS = 30*60


# --------------------------------------------------
# Background monitoring loop
# --------------------------------------------------

def monitoring_loop():

    print("\n========================================")
    print("   BACKGROUND WEATHER MONITOR STARTED")
    print("========================================")

    while True:

        try:

            run_monitoring_cycle()

        except Exception as error:

            print(
                "\nBackground monitoring error:"
            )

            print(error)

        print(
            f"\nNext automatic weather check "
            f"in {MONITOR_INTERVAL_SECONDS} seconds..."
        )

        time.sleep(
            MONITOR_INTERVAL_SECONDS
        )


# --------------------------------------------------
# Start background monitor
# --------------------------------------------------

def start_background_monitor():

    monitor_thread = threading.Thread(
        target=monitoring_loop,
        daemon=True,
        name="WeatherMonitor"
    )

    monitor_thread.start()

    return monitor_thread


# --------------------------------------------------
# Direct test
# --------------------------------------------------

if __name__ == "__main__":

    thread = start_background_monitor()

    print(
        "\nBackground monitoring is running."
    )

    print(
        "Press CTRL+C to stop."
    )

    try:

        while True:

            time.sleep(1)

    except KeyboardInterrupt:

        print(
            "\nBackground monitoring stopped."
        )