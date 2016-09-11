---
title: Support Vector Machines got offered a Deep Learning job
---

* #table of content
{:toc}

## Intro

Assume we are familiar with the fact that any deep discriminator has two parts: feature extractor and linear classifier. Innovations usually comes from engineering the former. It is therefore natural to wonder what if we rewire the later instead? A first experiment to do is replacing the usual softmax with some other well-known linear classifiers. Namely in this post I explore the soft-margined Support Vector Machine option, trained in One-Vs-Rest fashion. 

Notice that since the classifier and feature extractor is co-trained, replacing the classifer will change the kind of features learnt by the feature extractor. So the impact is network-wide and thus, do worth some time to consider.

The rest of this post refreshes the mathematical foundation of SVM formulation and optimization. I then proceed to introduce its implementation in the context of a deep classifier by Tensorflow. Have fun.

## Part 1: Refresh your SVM a.k.a Screening round

I'll derive SVM for real quick (no, it's not goin' to be any quick)

### Hard-margined reasoning

Suppose we want to classify over data $$(s_n, t_n)^N$$, with $$t_n \in \{-1, 1\}$$. Define the kernel $$\kappa(s_i, s_j) = \phi(s_i)^T\phi(s_j)$$ and the implicit decision boundary $$y(s;\theta, b) = \theta^T\phi (s) + b$$ (implicit, since $$\phi$$ is not explicitly defined). The euclidean distance from point $$s_n$$ to the decision boundary is then:

$$ d_n = t_n \frac{y(s_n; \theta, b)}{\left \| \theta \right \|} $$

Suppose data is linearly separable, i.e. there is at least one solution surface, SVM tries to find the best one. Amongst all data points there is always one that minimises $$d_n$$. Say this happens at $$s_{n'}$$, SVM formulation says that we want to maximize $$d_{n'}$$ to obtain the best surface. Let's say we did successfully maximize the thing by $$\theta^*$$. 

Since $$\theta^*$$ is the normal vector of our solution surface, we can scale it without affecting the surface's orientation (the solution). That means, if $$\theta^*$$ is a solution, $$c\theta^*$$ with $$c$$ being a non-zero constant, is also one. Assume $$t_ny(s_{n'}, \theta^*, b^*) = v$$, we know there is some $$c$$ that can be derived from $$v$$ such that:

$$t_n y(s_{n'}; c\theta^*, b^*) = 1$$

Now investigate $$c\theta^*$$. By definition of $$n'$$, this means $$t_ny(s_n, c\theta^*, b^*) \geq 1 \ \ \forall n \ (*)$$. Talking about the point $$s_{n'}$$, this means $$c\theta^*$$ maximises 

$$d_{n'} = \frac{ 1 }{\left \| c\theta^* \right \| }$$

Equivalently, $$c\theta^*$$ is also a maximizer of $${\left \| c\theta \right \|}^2 \ \ (**) $$

In both $$(*)$$ and $$(**)$$, we realise that $$c$$ and $$\theta$$ is coupled and thus $$c\theta$$ can be regarded as a single variable $$w$$. This allow a reformulation of the original optimization problem:

$$ \min_w \ \frac{1}{2} {\left \| w \right \|}^2$$

<center> subject to $$t_n y(s_n; w, b) \geq 1 \ \ \forall n$$ </center>

### Soft-margined reasoning

The above reasoning assumes separable data, due to this ideal situation we are able to establish a strict standard on all data points base on $$s_{n'}$$. Things need to relax when it comes to the linearly inseparable case. Namely we have to introduce a slack variable $$\xi_n$$ for each of the data points, so that some of them can violate the standard: $$t_n y(s_n; w, b) \geq 1$$. The soft-margined SVM objective is:

$$ \min_{\xi, w} \ C \sum_{n=1}^{N}\xi_n + \frac{1}{2} {\left \| w \right \|}^2$$

<center> subject to $$\xi_n \geq 0 \ \forall n$$ $$t_n y(s_n; w, b) \geq 1 - \xi_n$$</center>

Collectively denote the variables of interest $$\{\xi, w, b\}$$ as $$x$$, we rewrite the problem declaration:

$$\min_x \ f(x) \ \ s.t. \ \ g_{1n}(x) \leq 0 \ \ and \ \ g_{2n}(x) \leq 0 \ \forall n$$

<center> where $$ f(x) = C \sum_{n=1}^{N}\xi_n + \frac{1}{2} {\left \| w \right \|}^2$$ $$g_{1n}(x) = -\xi_n$$ $$g_{2n}(x) = 1 - \xi_n - t_ny(s_n; w, b)$$ </center>

Notice $$x$$ is a collection of parameters with component $$\xi$$, whose number of parameters equals to the number of data training points.

### Primal and Dual problems

Is there an unconstrained version of the above problem, cuz constraints are kinda ugly isn't it? In other words, is there a function $$P(x)$$ such that minimizing $$P(x)$$ yields the solution to our problem? In fact, there is one:

$$P(x) =  f(x) + \max_{\mu \geq 0, a \geq 0} \sum_n^N\mu_ng_{1n}(x) + a_ng_{2n}(x)$$

Equivalence can be mentally checked easily by investigating two cases. First, for each $$x$$ that violates **at least one** constraint, check that $$P(x)$$ reaches $$+\infty$$ and thus cannot be a minimum. Second, for each $$x$$ that satisfies **all** constraints, check that $$P(x) \equiv f(x)$$. Minimizing $$P(x)$$ is called the **Primal** problem (which is essentially a **minimax** problem), and turns out this one is no less nasty than the original one since minimax problems are definitely not easy to handle. 

Fortunately the whole Primal idea is not just about throwing away constraints, a guy named [Slater](https://en.wikipedia.org/wiki/Slater%27s_condition) and his friend told us that, for the specific problem we are solving, the equivalence extends a bit further: the corresponding **maximin** problem yields the same solution to our minimax problem (Primal problem) and thus the same solution to our original problem. This maximin problem is called the **Dual** problem, and turns out to be quite nice to its pet human whenever they do some trick to its amuse. Next part will introduce that trick called KKT necessary conditions.

To have a clearer notation that faithfully serves the names "minimax" and "maximin", let's introduce $$L(x, \mu, a) = f(x) + \sum_n^N\mu_ng_{1n}(x) + a_ng_{2n}(x)$$. Then the Primal and Dual problems respectively become

$$\min_x \max_{\mu \geq 0, a \geq 0} L(x, \mu, a)$$

$$\max_{\mu \geq 0, a \geq 0} \min_x L(x, \mu, a)$$

Absolutely on-point, isn't it?

### Solving the dual problem by the help of KKT conditions

There is another giant's shoulder to step on besides Slater's in the quest for $$x^*$$. It concerns something called **Karush-Kuhn-Tucker (KKT) conditions**: conditions that are *necessary* for any solution $$x^*$$ of our optimization problem. In other words, from the fact that $$x^*$$ is a solution to our problem, what can we infer? Just for the record, these conditions later greatly simplify the Dual problem.

We can actually derive such conditions intuitively. Check [here](http://www.onmyphd.com/?p=kkt.karush.kuhn.tucker) for a longer talk, I'll just cherry pick here the sweetest parts for the sake of our SVM. First, look at an illustrative plot of $$f(x)$$ and $$g(x)$$. There are only two possible scenarios:

<center>
<img src = "http://www.onmyphd.com/pages/kkt/graphical.explanation.svg" alt="img1" style ="width: 400px;"/> </center>

On the left: the solution $$\hat{x}$$ of the unconstrained problem satifies $$g$$, thus it is also solution $$x^*$$ to the whole problem. To obtain $$x^*$$, we can optimize $$f$$ regardless of $$g$$, i.e. minimizing $$L(x)$$ with $$\mu_n = a_n = 0 \ \forall n$$ solves an equivalent problem. On the right: solution to the unconstrained problem does not satify $$g$$, thus $$x^*$$ lies on the boundary of $$g$$-satified region, where $$g(x^*) = 0$$. Again, minimizing $$L(x)$$ along $$g(x) = 0$$ solves an equivalent problem.

Either case, $$\mu_ng_{1n}(x^*) = a_ng_{2n}(x^*) = 0$$. I.e. our first two KKT conditions are:

$$ \mu_n \xi_n^* = 0 \ \forall n \ \ (1)$$

$$ a_n(t_ny(s_n; w^*, b^*)-1+\xi_n^*) = 0 \ \forall n \ \ (2)$$

Remember that $$x^*$$ solves the Dual problem $$\{ \max_{\mu \geq 0, a \geq 0} \min_x L(x, \mu, a) \}$$, which means  $$x^*$$ minimizes $$L(x, \mu, a)$$. This gives the next conditions: $$ \bigtriangledown_xL(x^*, \mu, a) = 0 $$. Taking the partial derivative with respect to $$w$$, $$b$$, and $$\xi$$ separately yields:

$$ w^* = \sum_n^N a_nt_n\phi(s_n) \ \ (3)$$

$$ \sum_n^N a_nt_n = 0 \ \ (4)$$

$$ a_n = C - \mu_n \ \ (5)$$

The remaining conditions are obvious: $$ a_n \geq 0, \ $$
$$ \mu_n \geq 0 \ \ (6) $$

### Final form of the Dual problem

Now that's everything is settled, we are ready to simplify the Dual problem as promised. In fact, we will use all KKT conditions that involves $$x^*$$ as substitutions into the Dual objective. The obvious effect is that we completely eliminate $$\{w, b, \xi \}$$ variables out of the Dual objective. Also use $$(5)$$ to throw away $$\mu$$. Finally we obtain the simplified objective of maximization: $$\tilde{L}(a) = \sum_n^N a_n - \frac{1}{2}\sum_i^N\sum_j^N a_ia_j\kappa(s_i, s_j)$$. This optimization is subjected to $$(4)$$, $$(5)$$ and $$(6)$$ - conditions that involves $$a$$ - which, can be rewritten as 

$$a_i \in [ 0, C ]$$

$$\sum_n^N a_nt_n = 0$$

But there is something else happening, a side effect that reveals itself after the derivation of $$\tilde{L}$$: $$\kappa$$, who emerges from the disappearance of $$\phi$$. They say the thing did its **kernel trick**. But what's good about $$\kappa$$ anyway? To shortly explain the hype around $$\kappa$$, consider solving the Dual problem in this final form. Clearly we only have to deal with $$\kappa$$, not $$\phi$$ explicitly. There's a body of theories around this situation that states that there are certain $$\kappa$$ which are extremely convenient to deal with mathematically, who turn out to have their $$\phi$$ ultra-high-dimensional, sometimes even infinite. 

In other words, we are able to learn non-parameterized high-quality features without the need to deal with the curse of dimensionality. In the context of **Deep Learning**, $$\phi$$ is **explicitly defined** as the feature extractor of the network and its parameters are trained jointly with $$x^*$$. We'll come back to this point in Part 2.

### Sequential minimal optimization: the Dual solver

How come this final form of Dual objective nicer to solve than, say, the Original and the Primal?

Realise that the Dual objective is a polynomial of degree 2 for each of the $$a_n$$, the problem is thus convex and if we are able to progressively better the objective until convergence, the solution is found. So, we are talking about an interative algorithm and wish to define a convergence criteria for it. In fact, the KKT conditions $$(1)$$ and $$(2)$$ implies three things that can be used to check convergence around the optimal point:

$$1. \ \ a_n = 0 \Rightarrow t_ny(s_n; w^*, b^*) \geq 1 $$

$$2. \ \ a_n \in (0, C) \Rightarrow t_ny(s_n; w^*, b^*) = 1 $$

$$3. \ \ a_n = C \Rightarrow t_ny(s_n; w^*, b^*) \leq 1 $$

There is this guy [John Platt](https://en.wikipedia.org/wiki/Sequential_minimal_optimization) who proposed the algorithm we are looking for. His reasoning goes roughly like this: pick a subset from $$\{a_1, a_2, ..., a_N \}$$ and optimize the objective with respect to this subset, because that's easier than dealing with the whole bunch. Pick another one and another one and repeat until convergence. Basically each time we optimize a sub-problem, and this problem has to have at least two variables because otherwise, the equality constraint $$(4)$$ gives no room for (single-variable) optimization. And in fact he did choose $$2$$ to be the size of all sub-problems.

The sub-problem goes as follows: Maximize $$\tilde{L}$$ with respect to a pair of variable $$\{a_n, a_m\}$$ such that $$0 \leq a_n, a_m \leq C$$. From $$(4)$$ we get $$t_na_n + t_ma_m = k$$ where $$k$$ is the current value of $$ - \sum_{i \not = n, m} t_ia_i $$. This gives a one to one correspondence between $$a_n$$ and $$a_m$$, hence the sub-problem reduce to a single-variable optimization problem. Say we choose to express $$a_n$$ in terms of $$a_m$$ and solve the single-variable problem in $$a_m$$, there is another thing to care about: the bound $$[0, C]$$ of $$a_m$$ must be adjusted so that $$a_n$$ also lies in $$[0, C]$$.

Optimizing such single-variable quadratic function is something quite trivial: maximizer of $$q(x) = -x + c_1x + c2$$ is $$c_1/2$$. And since the problem is convex, the constraints can be handled easily by clipping the solution of the non-constrained problem back the the boundary of the feasible region. All the nitty-gritties that ensure convergence and heuristics to maximise algorithm's speed is discussed in the [original paper](https://www.microsoft.com/en-us/research/publication/sequential-minimal-optimization-a-fast-algorithm-for-training-support-vector-machines/). And there's that for SVM optimization!

## Part 2: Deep-SVM a.k.a Interview round

*"So your CV looks great, but what do you have to offer our company?"*

Say you had this deep feature extractor $$\phi(s_n; \alpha)$$ and would like to plug onto it the final layer being an SVM. From the previous part, we know that amounts to the following problem:

$$\min_{x} \ f(x) \ \ s.t. \ \ g_{1n}(x) \leq 0 \ \ and \ \ g_{2n}(x) \leq 0 \ \forall n$$

<center> where $$x = ( w, b, \xi, \alpha )$$ $$ f(x) = C \sum_{n=1}^{N}\xi_n + \frac{1}{2} {\left \| w \right \|}^2$$ $$g_{1n}(x) = -\xi_n$$ $$g_{2n}(x) = 1 - \xi_n - t_ny(s_n; w, \alpha)$$ $$y(s_n; w, b, \alpha) = w^T\phi(s_n; \alpha) + b$$</center>

### A first attempt at constructing deepSVM Loss

We can see that the construction of $$f$$ upon $$\phi$$ involves differentiable steps, thus back-propagation can comfortably flow the gradient all the way back from $$f$$ to $$\phi$$. It is, however, unclear how to incorporate the constraints into this optimization procedure. The general consensus, I found out, is to simply forget about the constraints and add new penalty terms into the objective to discourage violation. That means, for multi-class hard-margin SVM, the objective is as followed:

$$L(w, b) = \sum_k^K \frac{1}{2} \left \| W_k \right \|^2 + C \sum_n^N \varphi(1 - t_{kn}y(s_n; W_k, B_k, \alpha)) $$

Where $$\varphi(x) = max(0,x)$$, $$K$$ is the number of class and $$W_k$$ and $$b_k$$ is the corresponding $$(w, b)$$ of decision surface number $$k$$ - remember we are optimizing a One-vs-All SVM. The loss function for soft-margin is constructed in a similar fashion
 
$$L(x) = \sum_k^K \frac{1}{2} \left \| W_k \right \|^2 + \sum_n^N C \xi_{kn}+ \lambda \varphi(-\xi_{kn}) + \beta \varphi(1 - t_{kn}y(s_n; W_k, B_k, \alpha) - \xi_{kn})$$

### Tackle the first constraint $$g_{1n}$$

We know that the above objectives are not mathematically equivalent to the original one, so plugging such a thing on top of $$\phi$$ is not exactly doing SVM. Here we try to refine the soft-margin objective presented above to get it as close to the original as possible. Observe that the first constraint simply establish a domain restriction on $$\xi$$, but we know that auto differentiation will produce gradients that push $$\xi$$ below $$0$$ whenever needed. So an obvious thing to do is to clip the gradient whenever it makes $$\xi$$ falls below zero.

But there is a clever mathematical trick to this that accomplishes both: a function that allows optimization over whole-axis domain *and* produce stationary gradient at zero, thus get rid of the need of gradient clipping *as long as* the variable is initialised to be non-negative. This is the function $$x^2$$, whose derivative $$2x$$ becomes zero if and only if $$x^2 = 0$$. By replacing $$\xi = \nu^2$$, we are now able to optimise over $$\nu$$ freely and obtain a better approximation to our original Loss function - also get clear of the $$g_{1n}$$ penalty:

$$L_1(x) = \sum_k^K \frac{1}{2} \left \| W_k \right \|^2 + \sum_n^N C \nu_{kn}^2 + \lambda \varphi(1 - t_{kn}y(s_n; W_k, B_k, \alpha) - \nu_{kn}^2)$$

### Second constraint $$g_{2n}$$: hold back your adversarial training.

At this point, it is useful to look at what we are trying to approximate:

$$\min_x f(x) \ s.t. \ \ g_{kn}(x) \leq 0$$

<center> where $$x = (W, B, \nu, \alpha)$$
$$f(x) =\sum_k^K \frac{1}{2} \left \| W_k \right \|^2 + \sum_n^N C \nu_{kn}^2$$
$$g_{kn}(x) = 1 - t_{kn}y(s_n; W_k, B_k, \alpha) - \nu_{kn}^2$$
</center>

Going in the same direction as vanilla SVM to produce the Primal problem, we know that the following Lagrangian is equivalent to the original one:

$$L_2(x) = \sum_k^K \frac{1}{2} \left \| W_k \right \|^2 + \sum_n^N C \nu_{kn}^2 + \max_{\lambda \geq 0} \lambda_{kn} (1 - t_{kn}y(s_n; W_k, B_k, \alpha) - \nu_{kn}^2)$$

At this point one might be tempted to jump at optimizing this minimax problem, people have done that with [Deep Generative Adverserial Nets](http://bamos.github.io/2016/08/09/deep-completion/#ml-heavy-generative-adversarial-net-gan-building-blocks), so why not here? But hold on, realise that $$L_2$$ is strikingly similar to $$L_1$$. In fact, the similarity is not only syntactic, but also semantic. Suppose $$ 0 > g_{ kn } (x) $$, then $$\lambda_{kn} g_{kn}(x)$$ can not be positive, setting $$\lambda_{kn}$$ to zero is the only way to obtain maximization in $$L_2$$. For $$g_{kn}(x) = 0$$ it is clear that there is no room for optimization over $$\lambda$$ since $$\lambda_{kn}g_{kn}(x)$$ is always $$0$$. So either way, $$\max_{\lambda \geq 0} \lambda_{kn} g_{kn}(x)$$ $$=$$ $$\varphi(g_{kn}(x))$$ $$=$$ $$0$$. 

This gives the incentive to prove that $$L_1$$ is also similar to $$L_2$$ in its behavior: a non-constrained objective that achieve the same result to the original one. In fact, we have already done one of the two checks: Whenever $$x$$ does not violate **all** constraints, minimizing $$L_1$$ is the same as minimizing $$f(x)$$ since $$\varphi(g_{kn}(x)) = 0 \ \forall k, n$$. This left us with the other, more difficult check: $$x$$ that **some** $$g_{kn}(x) > 0$$. We want this to work in a similar fashion, i.e. to prove that $$L_1(x)$$ cannot be a local minimum. As a reminder, the primal objective can be summarised as:

- $$P(x) = f(x)$$ where $$x$$ feasible.

- $$P(x) = + \infty$$ elsewhere, clearly not a minimum.

While so far,

- $$L_1(x) = f(x)$$ where $$x$$ feasible.

- $$L_1(x)$$ finite elsewhere, but hopefully not a local minimum.

### Deriving the equivalence sufficient conditions 

If $$L_1$$ is not what we are expecting, we'll have to assume it is a good enough approximation of $$L_2$$ and implement both of them to compare the performances, where adversarial training is needed to work with $$L_2$$. Fortunately this turns out not to be the case. Look at $$L_1$$ when $$x$$ violates the constraint, $$\varphi$$ is now an identity:

$$L_1(x) = \sum_k^K \frac{1}{2} \left \| W_k \right \|^2 + \sum_n^N C \nu_{kn}^2 + \lambda (1 - t_{kn}y(s_n; W_k, B_k, \alpha) - \nu_{kn}^2)$$

Expand and get rid of the constants, we obtain an equivalent objective:

$$L_3(x) = \sum_k^K \frac{1}{2} \left \| W_k \right \|^2 + \sum_n^N (C - \lambda) \nu_{kn}^2 - \lambda t_{kn}y(s_n; W_k, B_k, \alpha)$$

Taking the derivative with respect to $$(W_k, \nu_{kn}, B_k)$$ and set them to zero to see the necessary conditions of local minima. Assuming $$\lambda$$ is a non zero constant, we obtain:

$$W_k = \lambda \sum_n^Nt_{kn}\phi(s_n; \alpha) \ \forall k \ \ (7)$$

$$\sum_n^N t_{kn} = 0 \ \forall k \ \ (8)$$

$$(C - \lambda)\nu_{kn} = 0 \ \forall k, n \ \ (9)$$

From this point, you will quickly see that arguments supporting $$L_3$$ overpower its opponents. 

Let's consider cases where at least one of the above conditions is immediately wrong. $$(8)$$ is clearly not true if $$K > 2$$ since by definition, the construction of $$t_{kn}$$ requires $$\sum_k^K\sum_n^Nt_{kn} = N(2 - K)$$, which cannot be zero as $$(8)$$ suggests if $$K > 2$$. To prove this, consider the aggregated matrix $$T$$ with $$t_{kn}$$ entries: it has a single $$1$$ entry for each column and $$-1$$ for all the remainings, and the summation is taking over all of its entries, thus the equality.

So let's assume $$K = 2$$. Note that this does not means $$(8)$$ automatically becomes true, this would require another assumption: an equal number of positive and negative training data points. Assume this assumption is satisfied, it can easily be broken by augmenting data points to produce unbalanced size of training examples, or simply make sure that **N is odd**. 

### Failed Batch Normalization: a final attempt

Let's see how far we can push this. Say we don't do that and let the rare case $$(8)$$ happens when $$K = 2$$. The place to look to now is (9), which is false if and only if $$C \not = \lambda$$ **and** $$\nu_{kn} \not = 0 \ \forall k, n$$. It is tougher to accomplish this, say we generally set $$C \not = \lambda$$, so $$(9)$$ is true if and only if $$\nu_{kn} = 0 \ \forall n, k$$. This and the fact that $$\exists k', n'$$ such that $$g_{n'k'} > 0$$ gives $$1 > t_{k'n'}W_{k'}^T\phi_n + B_{k'}$$. Subtitute $$(7)$$ into this inequality and we have:

$$1 > \lambda t_{k'n'} \left ( \sum_m^N t_{k'm} \kappa_{mn'} + B_{k'}\right)$$

Now since we are assuming the rare case $$(8)$$ - which implies $$K = 2$$ as well as $$N$$ being even, there is an equal number of positive and negative training examples. Without any loss of generality, assume further that the training samples that are in the same category with $$s_{n'}$$ are the first $$N/2$$ training points, this turns the above inequality into a tidier one:

$$\lambda^{-1} > \sum_{i}^{h} \kappa_{in'} - \kappa_{(h+i)n'} + B_{k'}$$

Where $$h = N/2$$. This is essentially a constraint established on the deep extractor $$\phi$$ and thus, its weight parameters $$\alpha$$. Say we are applying [batch normalization](http://arxiv.org/abs/1502.03167) without shift and scale to produce the $$\phi$$ layer, this makes the sum $$\sum_n^N \kappa_{nn'} = \left (\sum_n^N \phi_n^T \right) \phi_{n'}$$ becomes zero. Add $$\left(-\sum_i^h\kappa_{in'}\right)$$ to $$-\sum_i^h\kappa_{(h+i)n'}$$ to make a zero, and we simplified the inequality even further:

$$ \lambda^{-1} > 2\sum_i^h\kappa_{in'} + B_{k'}$$

This is the necessary condition for $$x$$ to be a local minimum, to guarantee violation of this inequality, we make sure that the chosen value for hyper parameter $$\lambda^{-1}$$ is smaller than the lower bound of RHS, which unfortunately, can be arbitrary negative during training, mainly because of $$B_{k'}$$. I believe there are some clever way to crack this using careful initialization, but man, does that worth the time? $$L_1$$ is already a damn good approximation! The reason why can be summarised by the following rules of thumb:

1. $$K > 2$$ guarantees equivalence between $$L_1$$ and SVM.

2. For $$K = 2$$, $$N$$ being odd also guarantees equivalence between $$L_1$$ and SVM. This can be done simply by choosing an odd batch size for training, that make sure whenever $$x$$ violates $$g(x) \leq 0$$, it won't get stuck.

*"So that is all there is I have to offer, do you think I'm a good match?" - The interviewee asked. - "Let's move on to your work now shall we?"*

## DeepSVM at work: a Tensorflow implementation

[To be added]