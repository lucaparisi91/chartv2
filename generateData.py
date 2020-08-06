import pandas as pd
import numpy as np
import scipy as sp
import random
import matplotlib.pylab as plt

def generateData(size=1000,sigma=0.1):
    x=np.linspace(-0.5,2,num=size)
    y= np.exp(-(x+0.5)/0.3) - 0.5  + sigma*np.random.normal(size=size)

    data= {"x" : x , "y" : y}

    return pd.DataFrame(data)


if __name__ == "__main__":

    data=generateData(size=1000000,sigma=0.05)
    data.to_csv("mockData.dat",sep=" ")
    plt.plot(data["x"],data["y"],"or")
    plt.show()