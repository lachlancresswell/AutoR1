from setuptools import setup


setup(name='autor1',
      version='1.7.0',
      description='Automated view and control generator for d&b audiotechnik .dbpr files',
      author='Lachlan',
      packages=['r1py', 'autor1', 'app'],
    entry_points={
        "console_scripts": [
            "app = src.__main__:main"
        ]
    },
)
