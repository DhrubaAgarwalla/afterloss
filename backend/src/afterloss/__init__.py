"""AfterLoss core package: rules, discovery, forms, privacy and AWS adapters.

Everything under afterloss.rules, afterloss.discovery, afterloss.forms and
afterloss.privacy is plain Python with no AWS calls, so it runs in unit tests
and in the local (Build It) mode. AWS access lives in afterloss.aws.
"""

__version__ = "0.1.0"
