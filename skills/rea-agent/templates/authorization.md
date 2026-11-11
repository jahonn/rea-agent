# Authorization and risk acknowledgement

Before target inspection, ask the user to confirm:

1. The exact target and the ownership, written authorization, or license terms that permit this investigation.
2. The legitimate purpose: learning and research, authorized security assessment, interoperability, or recovery of the user's own software.
3. That the results will not be used to bypass licensing, DRM, payment or access controls, steal secrets, enable unauthorized access, or distribute infringing copies.

Then present this acknowledgement:

> I authorize investigation of the identified target within the stated scope. I understand that static and dynamic findings are interpretations supported by collected evidence, not a recovery of original source code. Runtime capture may execute the target with my permissions and is not a sandbox. Local analysis results sent to an AI model are subject to that model provider's data policy. I am responsible for ensuring that my target, tools, and intended use are legally authorized.

Proceed only after explicit acceptance. Ask for separate confirmation before runtime capture, installation of analysis engines, or expanding the target scope.
