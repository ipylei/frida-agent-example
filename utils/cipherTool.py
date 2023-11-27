import random
import ssl
from urllib3.util.ssl_ import create_urllib3_context

from requests.adapters import HTTPAdapter

ORIGIN_CIPHERS = (
    'ECDH+AESGCM:DH+AESGCM:ECDH+AES256:DH+AES256:ECDH+AES128:DH+AES:ECDH+HIGH:DH+HIGH:ECDH+3DES:DH+3DES:RSA+AESGCM:RSA+AES:RSA+HIGH:RSA+3DES'
)


class MyAdapterRequests(HTTPAdapter):
    def __init__(self, *args, **kwargs):
        """
        A TransportAdapter that re-enables 3DES support in Requests.
        """
        ciphers = ORIGIN_CIPHERS.split(':')
        random.shuffle(ciphers)
        print("打乱了")
        ciphers = ':'.join(ciphers)
        self.ciphers = ciphers + ':!aNULL:!eNULL:!MD5'
        super().__init__(*args, **kwargs)

    def init_poolmanager(self, *args, **kwargs):
        context = create_urllib3_context(ciphers=self.ciphers)
        kwargs['ssl_context'] = context
        return super(MyAdapterRequests, self).init_poolmanager(*args, **kwargs)

    def proxy_manager_for(self, *args, **kwargs):
        context = create_urllib3_context(ciphers=self.ciphers)
        kwargs['ssl_context'] = context
        return super(MyAdapterRequests, self).proxy_manager_for(*args, **kwargs)


class MyAdapterHttpx:
    def __init__(self, ciphers_str=""):
        if ciphers_str:
            self.ciphers = ciphers_str
        else:
            ciphers = ORIGIN_CIPHERS.split(":")
            random.shuffle(ciphers)
            ciphers = ":".join(ciphers)
            self.ciphers = ciphers + ":!aNULL:!eNULL:!MD5"

    def __call__(self) -> ssl.SSLContext:
        context = ssl.create_default_context()
        context.set_ciphers(self.ciphers)
        return context
