import base64
import json
import sys
import urllib.request
from pathlib import Path
import websocket

BASE = Path(__file__).resolve().parent


class Browser:
    def __init__(self):
        targets = json.load(urllib.request.urlopen('http://localhost:9223/json'))
        target = next(item for item in targets if item['type'] == 'page')
        self.ws = websocket.create_connection(target['webSocketDebuggerUrl'], origin='http://localhost:9223', timeout=90)
        self.sequence = 0
        self.events = []
        self.call('Runtime.enable')
        self.call('Page.enable')

    def call(self, method, params=None):
        self.sequence += 1
        number = self.sequence
        self.ws.send(json.dumps({'id': number, 'method': method, 'params': params or {}}))
        while True:
            message = json.loads(self.ws.recv())
            if message.get('id') == number:
                if 'error' in message:
                    raise RuntimeError(message['error'])
                return message.get('result', {})
            self.events.append(message)

    def evaluate(self, expression):
        result = self.call('Runtime.evaluate', {'expression': expression, 'awaitPromise': True, 'returnByValue': True})
        if 'exceptionDetails' in result:
            raise RuntimeError(json.dumps(result['exceptionDetails'], ensure_ascii=False))
        return result.get('result', {}).get('value')

    def viewport(self, width, height=844):
        self.call('Emulation.setDeviceMetricsOverride', {'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': False})

    def screenshot(self, name):
        metrics = self.call('Page.getLayoutMetrics')['cssContentSize']
        result = self.call('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': True, 'clip': {'x': 0, 'y': 0, 'width': metrics['width'], 'height': metrics['height'], 'scale': 1}})
        output = BASE / name
        output.write_bytes(base64.b64decode(result['data']))
        return str(output)


if __name__ == '__main__':
    browser = Browser()
    command = sys.argv[1]
    if command == 'open':
        browser.viewport(int(sys.argv[2]) if len(sys.argv) > 2 else 390)
        print(browser.call('Page.navigate', {'url': 'http://127.0.0.1:8766/images/assets_backstage/mini-runtime.html'}))
    elif command == 'eval':
        print(json.dumps(browser.evaluate(sys.argv[2] if len(sys.argv) > 2 else sys.stdin.read()), ensure_ascii=False, indent=2))
    elif command == 'screenshot':
        print(browser.screenshot(sys.argv[2]))
    elif command == 'width':
        browser.viewport(int(sys.argv[2]))
        print('viewport', sys.argv[2])
    browser.ws.close()
